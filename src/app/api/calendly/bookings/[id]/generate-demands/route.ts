import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

type GeneratedDemand = {
  title: string;
  description: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  type: "SUPPORT" | "ESCALATION" | "REQUEST" | "INTERNAL";
  dueDays?: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();

  const { id } = await params;

  const booking = await prisma.calendlyBooking.findUnique({
    where: { id },
    include: {
      csOwner: true,
      company: { select: { id: true, name: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Agendamento não encontrado" },
      { status: 404 }
    );
  }

  const role = session.user.role;

  if (role === "CS_OWNER") {
    const csOwner = await prisma.cSOwner.findFirst({
      where: { user: { id: session.user.id } },
    });
    if (!csOwner || booking.csOwnerId !== csOwner.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  } else if (role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const content = booking.summary || booking.transcript || "";
  const actionItems = (booking.actionItems as Array<{ description: string }>) || [];

  if (!content && actionItems.length === 0) {
    return NextResponse.json(
      { error: "Nenhum conteúdo disponível para análise" },
      { status: 400 }
    );
  }

  let actionItemsText = "";
  if (actionItems.length > 0) {
    actionItemsText = "\n\nAction Items do Fathom:\n" +
      actionItems.map((item, i) => `${i + 1}. ${item.description}`).join("\n");
  }

  const prompt = `Analise o conteúdo da reunião abaixo e extraia os próximos passos/ações necessárias.

Contexto:
- Empresa: ${booking.company?.name || "Não informada"}
- Participante: ${booking.attendeeName}
- Data da reunião: ${new Date(booking.startTime).toLocaleDateString("pt-BR")}

Conteúdo:
${content}
${actionItemsText}

Extraia as demandas/ações identificadas. Para cada item, retorne:
- title: título curto e objetivo (máx 100 caracteres)
- description: descrição detalhada da tarefa
- priority: URGENT, HIGH, MEDIUM ou LOW
- type: SUPPORT (suporte técnico), ESCALATION (escalação), REQUEST (solicitação do cliente) ou INTERNAL (tarefa interna)
- dueDays: número de dias sugerido para prazo (opcional)

Retorne APENAS um array JSON válido, sem texto adicional. Se não houver demandas identificáveis, retorne um array vazio [].`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em extrair tarefas e próximos passos de reuniões de Customer Success. Responda apenas com JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let demands: GeneratedDemand[] = [];

    try {
      const parsed = JSON.parse(responseText);
      demands = Array.isArray(parsed) ? parsed : (parsed.demands || parsed.items || []);
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA" },
        { status: 500 }
      );
    }

    if (demands.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma demanda identificada",
        demands: [],
        created: 0,
      });
    }

    const createdDemands = [];

    for (const demand of demands) {
      let dueDate: Date | null = null;
      if (demand.dueDays && demand.dueDays > 0) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + demand.dueDays);
      }

      const created = await prisma.demand.create({
        data: {
          title: demand.title.slice(0, 200),
          description: `${demand.description}\n\n---\nGerado automaticamente da reunião: ${booking.title}\nData: ${new Date(booking.startTime).toLocaleDateString("pt-BR")}`,
          type: demand.type || "REQUEST",
          priority: demand.priority || "MEDIUM",
          status: "OPEN",
          dueDate,
          createdBy: session.user.id,
          assignedToId: booking.csOwnerId,
          companyId: booking.companyId,
        },
      });

      createdDemands.push(created);
    }

    if (booking.companyId) {
      await prisma.timelineEvent.create({
        data: {
          companyId: booking.companyId,
          type: "MILESTONE",
          title: "Demandas geradas por IA",
          description: `${createdDemands.length} demanda(s) criada(s) a partir da reunião "${booking.title}"`,
          date: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${createdDemands.length} demanda(s) criada(s)`,
      demands: createdDemands,
      created: createdDemands.length,
    });
  } catch (error) {
    console.error("[Generate Demands] Error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar demandas" },
      { status: 500 }
    );
  }
}
