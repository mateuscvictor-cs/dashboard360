import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { demandService } from "./demand.service";
import { activityService } from "./activity.service";
import type { DemandType, PendingType, Priority, Cadence, DeliveryType } from "@prisma/client";

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
  | "ask_user_choice"
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
- create_demands: criar demandas/tarefas. params: { items: [{ title, description?, priority?, dueDate?, type? }], companyId, assignedToId }
- create_deliveries: criar entregas. params: { items: [{ title, description?, dueDate?, type?, impact?, cadence?, assignee? }], companyId }
- create_pendings: criar pendências. params: { items: [{ title, dueDate, type?, priority? }], csOwnerId, companyId? }
- create_companies: cadastrar empresas. params: { items: [{ name, segment?, plan?, csOwnerId?, framework?, tags? }] }
- ask_user_choice: quando o usuário quer criar algo mas com poucos dados, pergunte. params: { message: "Identifiquei que você quer criar X. Prefere: 1) Criar com os dados informados ou 2) Adicionar mais detalhes (descrição, CS, tipo, prazo, etc.)? Responda 1 ou 2.", parsedAction: {...} }

Prioridades: URGENT, HIGH, MEDIUM, LOW
Tipos de demanda: SUPPORT, ESCALATION, REQUEST, INTERNAL
Tipos de pending: FOLLOWUP, CHECKLIST, DELIVERY, NUTRITION
Tipos de entrega: AUTOMATION, IPC, MEETING, WORKSHOP, HOTSEAT, OTHER
Cadência: DAILY, WEEKLY, BIWEEKLY, MONTHLY, CUSTOM
Datas: formato ISO ou "YYYY-MM-DD"
assignee: nome do CS responsável (será mapeado para id)

Use ask_user_choice quando o pedido for vago ou tiver poucos detalhes. Caso contrário, retorne a ação direta.
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
      "ask_user_choice",
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

function toDeliveryType(val: unknown): DeliveryType | undefined {
  const s = String(val || "").toUpperCase();
  if (["AUTOMATION", "IPC", "MEETING", "WORKSHOP", "HOTSEAT", "OTHER"].includes(s)) return s as DeliveryType;
  return undefined;
}

function toCadence(val: unknown): Cadence | undefined {
  const s = String(val || "").toUpperCase();
  if (["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"].includes(s)) return s as Cadence;
  return undefined;
}

const AI_METADATA = { source: "ai_assistant" };

async function createTimelineEvent(
  companyId: string,
  entityType: "demand" | "delivery" | "pending",
  entityId: string,
  title: string,
  description?: string
) {
  await prisma.timelineEvent.create({
    data: {
      companyId,
      type: "MILESTONE",
      title,
      description: description || undefined,
      date: new Date(),
      metadata: { ...AI_METADATA, entityType, entityId },
    },
  });
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
  needsConfirmation?: boolean;
  parsedAction?: ParsedAction;
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

  if (parsed.action === "ask_user_choice") {
    const msg = (parsed.params.message as string) || "Prefere criar com os dados informados (1) ou adicionar mais detalhes (2)?";
    const stored = parsed.params.parsedAction as ParsedAction | undefined;
    return {
      success: false,
      needsConfirmation: true,
      message: msg,
      parsedAction: stored && stored.action !== "unknown" ? stored : undefined,
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
        if (companyId) {
          await createTimelineEvent(
            companyId,
            "demand",
            demand.id,
            "Demanda criada por IA",
            demand.title
          );
        }
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

      const validTypes = ["AUTOMATION", "IPC", "MEETING", "WORKSHOP", "HOTSEAT", "OTHER"];
      const created = [];
      for (const item of items) {
        const title = String(item.title || "").trim();
        if (!title) continue;
        const typeVal = toDeliveryType(item.type);
        const delivery = await prisma.delivery.create({
          data: {
            title: title.slice(0, 200),
            description: item.description ? String(item.description).slice(0, 2000) : undefined,
            type: typeVal && validTypes.includes(typeVal) ? typeVal : undefined,
            impact: toPriority(item.impact),
            cadence: toCadence(item.cadence) || undefined,
            assignee: item.assignee ? String(item.assignee).slice(0, 100) : undefined,
            dueDate: parseDate(item.dueDate),
            companyId,
            status: "PENDING",
          },
        });
        created.push(delivery);
        await createTimelineEvent(
          companyId,
          "delivery",
          delivery.id,
          "Entrega criada por IA",
          delivery.title
        );
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
        if (companyId) {
          await createTimelineEvent(
            companyId,
            "pending",
            pending.id,
            "Pendência criada por IA",
            pending.title
          );
        }
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

        const tags = Array.isArray(item.tags)
          ? item.tags.map((t: unknown) => String(t).slice(0, 50)).slice(0, 10)
          : item.tags
            ? [String(item.tags).slice(0, 50)]
            : undefined;
        const company = await prisma.company.create({
          data: {
            name: name.slice(0, 200),
            segment: item.segment ? String(item.segment).slice(0, 100) : undefined,
            plan: item.plan ? String(item.plan).slice(0, 100) : undefined,
            framework: item.framework ? String(item.framework).slice(0, 100) : undefined,
            tags: tags || [],
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

const CONFIRM_PATTERNS = /^(1|sim|s|sim\s*criar|criar|ok|confirmo|confirmar|pode\s*criar)$/i;

export type ConversationContext = {
  previousAction: ParsedAction;
  previousMessage: string;
};

export async function processMessage(
  message: string,
  context: AIAssistantContext,
  conversationContext?: ConversationContext
): Promise<ExecuteResult> {
  if (conversationContext?.previousAction && CONFIRM_PATTERNS.test(message.trim())) {
    return executeAction(conversationContext.previousAction, context);
  }
  const parsed = await parseAction(message, context);
  return executeAction(parsed, context);
}
