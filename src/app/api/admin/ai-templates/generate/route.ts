import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import prisma from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

type Suggestion = {
  title: string;
  description: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  type: "INTERNAL";
  companyId?: string;
  companyName?: string;
  assignedToId: string;
  dueDays?: number;
};

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = await request.json();
    const { prompt, csOwnerId } = body as { prompt?: string; csOwnerId?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt é obrigatório" },
        { status: 400 }
      );
    }

    const csOwners = csOwnerId
      ? await prisma.cSOwner.findMany({
          where: { id: csOwnerId },
          include: {
            companies: {
              include: {
                _count: {
                  select: {
                    hotseats: true,
                    workshops: true,
                    ipcs: true,
                    contacts: true,
                    deliveries: true,
                  },
                },
              },
            },
          },
        })
      : await prisma.cSOwner.findMany({
          include: {
            companies: {
              include: {
                _count: {
                  select: {
                    hotseats: true,
                    workshops: true,
                    ipcs: true,
                    contacts: true,
                    deliveries: true,
                  },
                },
              },
            },
          },
        });

    const context = csOwners.map((cs) => ({
      id: cs.id,
      name: cs.name,
      companiesCount: cs.companies.length,
      companies: cs.companies.map((c) => ({
        id: c.id,
        name: c.name,
        csOwnerId: cs.id,
        hotseatsCount: c._count.hotseats,
        workshopsCount: c._count.workshops,
        ipcsCount: c._count.ipcs,
        contactsCount: c._count.contacts,
        deliveriesCount: c._count.deliveries,
        onboardingStatus: c.onboardingStatus ?? null,
        framework: c.framework ?? null,
        healthStatus: c.healthStatus,
      })),
    }));

    const systemPrompt = `Você é um gestor experiente de Customer Success. Pense como um líder de operação CS: priorize tarefas, sugira prazos realistas baseados na complexidade e na capacidade do CS, considere a urgência vs. importância. Sua resposta deve ser APENAS um objeto JSON válido.`;

    const userPrompt = `O administrador solicitou a criação de tarefas/demandas com o seguinte pedido:

"${prompt.trim()}"

Contexto das contas (CS e suas empresas):
${JSON.stringify(context, null, 2)}

Analise o que está vazio, incompleto ou demanda atenção em cada empresa. Pense como um gestor de CS e gere sugestões de demandas concretas e acionáveis. Para cada sugestão:
- title: título curto e objetivo (máx 100 caracteres)
- description: descrição detalhada da tarefa
- priority: URGENT, HIGH, MEDIUM ou LOW (baseado na urgência e impacto)
- type: sempre "INTERNAL" para tarefas operacionais
- companyId: ID da empresa quando a tarefa for específica (obrigatório se for por empresa)
- companyName: nome da empresa (para referência)
- assignedToId: ID do CS Owner responsável (use o id do CS do contexto - cada empresa pertence a um CS)
- dueDays: prazo sugerido em dias a partir de hoje (obrigatório - sugira prazos realistas como gestor, ex: 3, 7, 14)

Retorne um objeto JSON com a chave "suggestions" contendo um array. Se não houver sugestões, retorne {"suggestions": []}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let parsed: { suggestions?: Suggestion[] };

    try {
      parsed = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA" },
        { status: 500 }
      );
    }

    const suggestions: Suggestion[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
      : [];

    const defaultCsId =
      csOwnerId ?? (context.length === 1 ? context[0]?.id : null);

    const enriched = suggestions
      .filter((s) => s.title)
      .map((s) => ({
        ...s,
        assignedToId: csOwnerId ?? s.assignedToId ?? defaultCsId ?? "",
      }))
      .filter((s) => s.assignedToId);

    return NextResponse.json({
      success: true,
      suggestions: enriched,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("[AI Templates Generate] Error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar sugestões" },
      { status: 500 }
    );
  }
}
