import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { demandService } from "./demand.service";
import { activityService } from "./activity.service";
import type { DemandType, PendingType, Priority } from "@prisma/client";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_APIKEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_APIKEY não configurada");
  }
  return new OpenAI({ apiKey });
}

export type AIAssistantAction =
  | "create_demands"
  | "create_deliveries"
  | "create_pendings"
  | "create_companies"
  | "unknown";

export type ParsedAction = {
  action: AIAssistantAction;
  params: Record<string, unknown>;
};

export type AIAssistantContext = {
  role: string;
  csOwnerId: string | null;
  userId: string;
  companies: { id: string; name: string; csOwnerId: string | null }[];
  csOwners: { id: string; name: string }[];
};

export async function loadContext(userId: string, role: string, csOwnerId: string | null): Promise<AIAssistantContext> {
  const where =
    role === "CS_OWNER" && csOwnerId
      ? { csOwnerId }
      : {};

  const [companies, csOwners] = await Promise.all([
    prisma.company.findMany({
      where,
      select: { id: true, name: true, csOwnerId: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.cSOwner.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    role,
    csOwnerId,
    userId,
    companies,
    csOwners,
  };
}

const SYSTEM_PROMPT = `Você é um assistente que interpreta comandos em português e retorna ações estruturadas em JSON.
Ações disponíveis:
- create_demands: criar demandas/tarefas. params: { items: [{ title, description?, priority?, dueDate? }], companyId, assignedToId }
- create_deliveries: criar entregas. params: { items: [{ title, description?, dueDate? }], companyId }
- create_pendings: criar pendências. params: { items: [{ title, dueDate, type?, priority? }], csOwnerId, companyId? }
- create_companies: cadastrar empresas. params: { items: [{ name, segment?, plan?, csOwnerId? }] }

Prioridades: URGENT, HIGH, MEDIUM, LOW
Tipos de demanda: SUPPORT, ESCALATION, REQUEST, INTERNAL
Tipos de pending: FOLLOWUP, CHECKLIST, DELIVERY, NUTRITION
Datas: formato ISO ou "YYYY-MM-DD"

Responda APENAS com um objeto JSON: {"action": "nome_da_acao", "params": {...}}
Se não reconhecer o comando, retorne {"action": "unknown", "params": {}}`;

function buildUserPrompt(message: string, context: AIAssistantContext): string {
  const companiesList = context.companies
    .map((c) => `- ${c.name} (id: ${c.id})`)
    .join("\n");
  const csOwnersList = context.csOwners
    .map((c) => `- ${c.name} (id: ${c.id})`)
    .join("\n");

  return `Contexto:
- Usuário: ${context.role}${context.csOwnerId ? `, csOwnerId: ${context.csOwnerId}` : ""}
- Empresas disponíveis:
${companiesList || "(nenhuma)"}
- CS Owners:
${csOwnersList}

Comando do usuário: "${message}"

Extraia a ação e os parâmetros. Para referências como "empresa X", use o id correto da lista. Para CS_OWNER, assignedToId deve ser ${context.csOwnerId || "o csOwner da empresa"}.`;
}

export async function parseAction(
  message: string,
  context: AIAssistantContext
): Promise<ParsedAction> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(message, context) },
    ],
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return { action: "unknown", params: {} };
  }

  try {
    const parsed = JSON.parse(content) as { action?: string; params?: Record<string, unknown> };
    const action = (parsed.action as AIAssistantAction) || "unknown";
    const validActions: AIAssistantAction[] = [
      "create_demands",
      "create_deliveries",
      "create_pendings",
      "create_companies",
      "unknown",
    ];
    return {
      action: validActions.includes(action) ? action : "unknown",
      params: (parsed.params as Record<string, unknown>) || {},
    };
  } catch {
    return { action: "unknown", params: {} };
  }
}

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toPriority(val: unknown): Priority {
  const s = String(val || "").toUpperCase();
  if (["URGENT", "HIGH", "MEDIUM", "LOW"].includes(s)) return s as Priority;
  return "MEDIUM";
}

function toDemandType(val: unknown): DemandType {
  const s = String(val || "").toUpperCase();
  if (["SUPPORT", "ESCALATION", "REQUEST", "INTERNAL"].includes(s)) return s as DemandType;
  return "REQUEST";
}

function toPendingType(val: unknown): PendingType {
  const s = String(val || "").toUpperCase();
  if (["FOLLOWUP", "CHECKLIST", "DELIVERY", "NUTRITION"].includes(s)) return s as PendingType;
  return "FOLLOWUP";
}

function ensureCompanyAccess(
  companyId: string | undefined,
  context: AIAssistantContext
): string | null {
  if (!companyId) return null;
  const company = context.companies.find((c) => c.id === companyId);
  return company ? company.id : null;
}

export type ExecuteResult = {
  success: boolean;
  message: string;
  results?: unknown[];
  error?: string;
};

export async function executeAction(
  parsed: ParsedAction,
  context: AIAssistantContext
): Promise<ExecuteResult> {
  if (parsed.action === "unknown") {
    return {
      success: false,
      message: "Não entendi o comando. Tente ser mais específico, por exemplo: 'Crie 3 tarefas para Empresa X com prazo 20/02'.",
    };
  }

  try {
    if (parsed.action === "create_demands") {
      const items = (parsed.params.items as Array<Record<string, unknown>>) || [];
      const companyId = ensureCompanyAccess(
        parsed.params.companyId as string,
        context
      );
      const assignedToId =
        (parsed.params.assignedToId as string) ||
        (companyId
          ? context.companies.find((c) => c.id === companyId)?.csOwnerId
          : null) ||
        context.csOwnerId;

      if (!assignedToId) {
        return {
          success: false,
          message: "Não foi possível determinar o responsável. Especifique a empresa ou o CS Owner.",
        };
      }

      const created = [];
      for (const item of items) {
        const title = String(item.title || "").trim();
        if (!title) continue;

        const demand = await demandService.create({
          title: title.slice(0, 200),
          description: item.description ? String(item.description).slice(0, 2000) : undefined,
          type: toDemandType(item.type),
          priority: toPriority(item.priority),
          dueDate: parseDate(item.dueDate) || undefined,
          companyId: companyId || undefined,
          assignedToId,
          createdBy: context.userId,
        });
        created.push(demand);
      }

      const companyName = companyId
        ? context.companies.find((c) => c.id === companyId)?.name || "a empresa"
        : "sem empresa";
      return {
        success: true,
        message: `${created.length} demanda(s) criada(s) para ${companyName}.`,
        results: created,
      };
    }

    if (parsed.action === "create_deliveries") {
      const items = (parsed.params.items as Array<Record<string, unknown>>) || [];
      const companyId = ensureCompanyAccess(
        parsed.params.companyId as string,
        context
      );

      if (!companyId) {
        return {
          success: false,
          message: "Informe a empresa. Use o nome exato de uma empresa da lista disponível.",
        };
      }

      const created = [];
      for (const item of items) {
        const title = String(item.title || "").trim();
        if (!title) continue;

        const delivery = await prisma.delivery.create({
          data: {
            title: title.slice(0, 200),
            description: item.description ? String(item.description).slice(0, 2000) : undefined,
            dueDate: parseDate(item.dueDate),
            companyId,
            status: "PENDING",
          },
        });
        created.push(delivery);
      }

      const companyName = context.companies.find((c) => c.id === companyId)?.name || "a empresa";
      return {
        success: true,
        message: `${created.length} entrega(s) criada(s) para ${companyName}.`,
        results: created,
      };
    }

    if (parsed.action === "create_pendings") {
      const items = (parsed.params.items as Array<Record<string, unknown>>) || [];
      const csOwnerId =
        (parsed.params.csOwnerId as string) || context.csOwnerId;
      const companyId = ensureCompanyAccess(
        parsed.params.companyId as string,
        context
      );

      if (!csOwnerId) {
        return {
          success: false,
          message: "Não foi possível determinar o CS Owner. Especifique ou use o contexto correto.",
        };
      }

      const created = [];
      for (const item of items) {
        const title = String(item.title || "").trim();
        const dueDate = parseDate(item.dueDate);
        if (!title || !dueDate) continue;

        const pending = await activityService.createPending({
          csOwnerId,
          companyId: companyId || undefined,
          title: title.slice(0, 200),
          dueDate,
          type: toPendingType(item.type),
          priority: toPriority(item.priority),
        });
        created.push(pending);
      }

      return {
        success: true,
        message: `${created.length} pendência(s) criada(s).`,
        results: created,
      };
    }

    if (parsed.action === "create_companies") {
      const items = (parsed.params.items as Array<Record<string, unknown>>) || [];
      const created = [];

      for (const item of items) {
        const name = String(item.name || "").trim();
        if (!name) continue;

        const csOwnerId =
          (item.csOwnerId as string) ||
          (context.role === "CS_OWNER" ? context.csOwnerId : null);
        if (context.role === "CS_OWNER" && !context.csOwnerId) {
          return {
            success: false,
            message: "CS Owner não identificado.",
          };
        }

        const company = await prisma.company.create({
          data: {
            name: name.slice(0, 200),
            segment: item.segment ? String(item.segment).slice(0, 100) : undefined,
            plan: item.plan ? String(item.plan).slice(0, 100) : undefined,
            csOwnerId: csOwnerId || undefined,
            onboardingStatus: "NOVO",
          },
        });
        created.push(company);
      }

      return {
        success: true,
        message: `${created.length} empresa(s) cadastrada(s).`,
        results: created,
      };
    }

    return { success: false, message: "Ação não implementada." };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao executar ação";
    return { success: false, message: msg, error: msg };
  }
}

export async function processMessage(
  message: string,
  context: AIAssistantContext
): Promise<ExecuteResult> {
  const parsed = await parseAction(message, context);
  return executeAction(parsed, context);
}
