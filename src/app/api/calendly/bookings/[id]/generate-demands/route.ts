import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import prisma from "@/lib/db";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_APIKEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_APIKEY ou OPENAI_API_KEY não configurada nas variáveis de ambiente");
  }
  return new OpenAI({ apiKey });
}

type GeneratedDemand = {
  title: string;
  description: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  type: "SUPPORT" | "ESCALATION" | "REQUEST" | "INTERNAL";
  dueDays?: number;
  contextExcerpt?: string;
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

  const rawContent = booking.summary || booking.transcript || "";
  const content = rawContent.slice(0, 15000);
  const actionItems = (booking.actionItems as Array<{ description: string }>) || [];

  if (!content && actionItems.length === 0) {
    return NextResponse.json(
      { error: "Nenhum conteúdo disponível para análise" },
      { status: 400 }
    );
  }

  let actionItemsText = "";
  if (actionItems.length > 0) {
    actionItemsText =
      "\n\nPróximas ações identificadas:\n" +
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

Extraia as demandas/ações identificadas. Para cada item, retorne em PORTUGUÊS BRASILEIRO:
- title: título curto e objetivo em português (máx 100 caracteres)
- description: descrição detalhada da tarefa em português
- priority: URGENT, HIGH, MEDIUM ou LOW
- type: SUPPORT (suporte técnico), ESCALATION (escalação), REQUEST (solicitação do cliente) ou INTERNAL (tarefa interna)
- dueDays: número de dias sugerido para prazo (opcional, número inteiro)
- contextExcerpt: trecho curto (1-3 frases) da transcrição/resumo que originou esta demanda, para dar contexto ao CS

Retorne APENAS um objeto JSON no formato: {"demands": [...]}
Se não houver demandas identificáveis, retorne {"demands": []}`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que extrai tarefas de reuniões de Customer Success. Todas as demandas (title e description) devem estar em português brasileiro. Responda APENAS com JSON válido no formato {\"demands\": [...]}.",
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
      const raw =
        parsed.demands ?? parsed.items ?? (Array.isArray(parsed) ? parsed : []);
      demands = Array.isArray(raw)
        ? raw.filter(
            (d: unknown) =>
              d && typeof d === "object" && "title" in d && typeof (d as { title: unknown }).title === "string"
          )
        : [];
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

    const typeMap: Record<string, "SUPPORT" | "ESCALATION" | "REQUEST" | "INTERNAL"> = {
      SUPPORT: "SUPPORT",
      ESCALATION: "ESCALATION",
      REQUEST: "REQUEST",
      INTERNAL: "INTERNAL",
    };
    const priorityMap: Record<string, "URGENT" | "HIGH" | "MEDIUM" | "LOW"> = {
      URGENT: "URGENT",
      HIGH: "HIGH",
      MEDIUM: "MEDIUM",
      LOW: "LOW",
    };

    for (const demand of demands) {
      let dueDate: Date | null = null;
      if (demand.dueDays && demand.dueDays > 0) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + demand.dueDays);
      }

      const type = typeMap[String(demand.type || "REQUEST").toUpperCase()] ?? "REQUEST";
      const priority = priorityMap[String(demand.priority || "MEDIUM").toUpperCase()] ?? "MEDIUM";
      const assignedToId = booking.csOwnerId ?? undefined;

      const created = await prisma.demand.create({
        data: {
          title: String(demand.title || "").slice(0, 200),
          description: `${demand.description || ""}\n\n---\nGerado automaticamente da reunião: ${booking.title}\nData: ${new Date(booking.startTime).toLocaleDateString("pt-BR")}`,
          type,
          priority,
          status: "OPEN",
          dueDate,
          createdBy: session.user.id,
          assignedToId,
          companyId: booking.companyId ?? undefined,
          sourceBookingId: booking.id,
          contextExcerpt: demand.contextExcerpt
            ? String(demand.contextExcerpt).slice(0, 500)
            : null,
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
    const message =
      error instanceof Error ? error.message : "Erro ao gerar demandas";
    const isConfigError = message.includes("OPENAI") && message.includes("configurada");
    return NextResponse.json(
      { error: isConfigError ? message : "Erro ao gerar demandas. Verifique os logs." },
      { status: 500 }
    );
  }
}
