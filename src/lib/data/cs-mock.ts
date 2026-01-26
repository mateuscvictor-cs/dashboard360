export interface CSOwner {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  accountsCount: number;
  completedToday: number;
  pendingTasks: number;
  status: "online" | "busy" | "offline";
  metrics: {
    weeklyCompletion: number;
    avgResponseTime: number;
    npsScore: number;
    accountsAtRisk: number;
  };
}

export interface TeamActivity {
  id: string;
  csOwnerId: string;
  type: "call" | "email" | "meeting" | "whatsapp" | "note" | "task";
  company: string;
  description: string;
  timestamp: string;
  duration?: number;
  outcome?: string;
}

export interface Pending {
  id: string;
  csOwnerId: string;
  type: "followup" | "checklist" | "delivery" | "nutrition";
  company: string;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "overdue";
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  company: string;
  assignedToId: string | null;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "completed" | "cancelled";
  type: "support" | "escalation" | "request" | "internal";
}

export interface ChecklistItem {
  id: string;
  csOwnerId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  date: string;
}

export interface WhatsAppGroup {
  id: string;
  csOwnerId: string;
  name: string;
  company: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  members: number;
}

export const mockCSOwners: CSOwner[] = [
  { 
    id: "1", 
    name: "Carlos Silva", 
    email: "carlos.silva@vanguardia.com",
    avatar: "CS", 
    role: "CS Care Lead",
    accountsCount: 12, 
    completedToday: 8, 
    pendingTasks: 4, 
    status: "online",
    metrics: { weeklyCompletion: 94, avgResponseTime: 15, npsScore: 72, accountsAtRisk: 1 }
  },
  { 
    id: "2", 
    name: "Ana Costa", 
    email: "ana.costa@vanguardia.com",
    avatar: "AC", 
    role: "CS Success",
    accountsCount: 10, 
    completedToday: 6, 
    pendingTasks: 3, 
    status: "online",
    metrics: { weeklyCompletion: 88, avgResponseTime: 22, npsScore: 68, accountsAtRisk: 2 }
  },
  { 
    id: "3", 
    name: "Pedro Santos", 
    email: "pedro.santos@vanguardia.com",
    avatar: "PS", 
    role: "CS Success",
    accountsCount: 8, 
    completedToday: 5, 
    pendingTasks: 5, 
    status: "busy",
    metrics: { weeklyCompletion: 72, avgResponseTime: 35, npsScore: 61, accountsAtRisk: 3 }
  },
  { 
    id: "4", 
    name: "Maria Oliveira", 
    email: "maria.oliveira@vanguardia.com",
    avatar: "MO", 
    role: "CS Success",
    accountsCount: 11, 
    completedToday: 9, 
    pendingTasks: 2, 
    status: "online",
    metrics: { weeklyCompletion: 91, avgResponseTime: 18, npsScore: 75, accountsAtRisk: 0 }
  },
  { 
    id: "5", 
    name: "Lucas Ferreira", 
    email: "lucas.ferreira@vanguardia.com",
    avatar: "LF", 
    role: "CS Junior",
    accountsCount: 6, 
    completedToday: 4, 
    pendingTasks: 3, 
    status: "online",
    metrics: { weeklyCompletion: 85, avgResponseTime: 28, npsScore: 65, accountsAtRisk: 1 }
  },
  { 
    id: "6", 
    name: "Juliana Mendes", 
    email: "juliana.mendes@vanguardia.com",
    avatar: "JM", 
    role: "CS Success",
    accountsCount: 9, 
    completedToday: 7, 
    pendingTasks: 2, 
    status: "offline",
    metrics: { weeklyCompletion: 89, avgResponseTime: 20, npsScore: 70, accountsAtRisk: 1 }
  },
];

export const mockTeamActivities: TeamActivity[] = [
  { id: "1", csOwnerId: "1", type: "call", company: "TechCorp Brasil", description: "Call de alinhamento sobre integração ERP", timestamp: "2026-01-22T10:30:00", duration: 30, outcome: "Definido próximos passos" },
  { id: "2", csOwnerId: "2", type: "whatsapp", company: "Varejo Express", description: "Respondido dúvida sobre relatórios", timestamp: "2026-01-22T10:15:00" },
  { id: "3", csOwnerId: "3", type: "meeting", company: "Fintech Solutions", description: "Review mensal de resultados", timestamp: "2026-01-22T09:00:00", duration: 60, outcome: "Cliente satisfeito" },
  { id: "4", csOwnerId: "4", type: "email", company: "LogiTech", description: "Enviado proposta de expansão", timestamp: "2026-01-22T08:45:00" },
  { id: "5", csOwnerId: "1", type: "note", company: "HealthPlus", description: "Registrado feedback sobre nova feature", timestamp: "2026-01-22T08:30:00" },
  { id: "6", csOwnerId: "2", type: "call", company: "EduTech", description: "Onboarding novo stakeholder", timestamp: "2026-01-22T08:00:00", duration: 45 },
  { id: "7", csOwnerId: "3", type: "whatsapp", company: "RetailMax", description: "Alinhamento de expectativas", timestamp: "2026-01-21T17:30:00" },
  { id: "8", csOwnerId: "4", type: "task", company: "DataDriven", description: "Atualizado status das entregas", timestamp: "2026-01-21T16:00:00" },
  { id: "9", csOwnerId: "5", type: "call", company: "StartupXYZ", description: "Primeiro contato pós-vendas", timestamp: "2026-01-22T11:00:00", duration: 25 },
  { id: "10", csOwnerId: "6", type: "meeting", company: "ConsultoriaPro", description: "Workshop de treinamento", timestamp: "2026-01-21T14:00:00", duration: 90 },
  { id: "11", csOwnerId: "1", type: "email", company: "TechCorp Brasil", description: "Enviado relatório semanal", timestamp: "2026-01-21T09:00:00" },
  { id: "12", csOwnerId: "2", type: "whatsapp", company: "Varejo Express", description: "Confirmado reunião de amanhã", timestamp: "2026-01-21T16:30:00" },
];

export const mockPendings: Pending[] = [
  { id: "1", csOwnerId: "1", type: "followup", company: "TechCorp Brasil", title: "Discutir expansão do contrato", dueDate: "2026-01-22", priority: "high", status: "pending" },
  { id: "2", csOwnerId: "1", type: "checklist", company: "", title: "Revisar alertas críticos", dueDate: "2026-01-22", priority: "high", status: "pending" },
  { id: "3", csOwnerId: "2", type: "delivery", company: "Varejo Express", title: "Entregar relatório de ROI", dueDate: "2026-01-21", priority: "high", status: "overdue" },
  { id: "4", csOwnerId: "2", type: "nutrition", company: "EduTech", title: "Enviar case de sucesso", dueDate: "2026-01-22", priority: "medium", status: "pending" },
  { id: "5", csOwnerId: "3", type: "followup", company: "Fintech Solutions", title: "Verificar satisfação pós-review", dueDate: "2026-01-23", priority: "medium", status: "pending" },
  { id: "6", csOwnerId: "3", type: "checklist", company: "", title: "Responder grupos de WhatsApp", dueDate: "2026-01-22", priority: "high", status: "overdue" },
  { id: "7", csOwnerId: "4", type: "delivery", company: "DataDriven", title: "Workshop de automação", dueDate: "2026-01-24", priority: "medium", status: "pending" },
  { id: "8", csOwnerId: "5", type: "followup", company: "StartupXYZ", title: "Check-in de primeira semana", dueDate: "2026-01-23", priority: "high", status: "pending" },
  { id: "9", csOwnerId: "3", type: "delivery", company: "RetailMax", title: "Documentação de integração", dueDate: "2026-01-20", priority: "high", status: "overdue" },
];

export const mockDemands: Demand[] = [
  { id: "1", title: "Escalonamento: Cliente insatisfeito com entregas", description: "TechCorp relatou atrasos recorrentes nas entregas do último mês. Precisa intervenção.", company: "TechCorp Brasil", assignedToId: "1", createdBy: "Admin", createdAt: "2026-01-22T08:00:00", dueDate: "2026-01-22", priority: "urgent", status: "in_progress", type: "escalation" },
  { id: "2", title: "Solicitação de treinamento extra", description: "Varejo Express solicitou treinamento adicional para novos colaboradores.", company: "Varejo Express", assignedToId: "2", createdBy: "Admin", createdAt: "2026-01-21T14:00:00", dueDate: "2026-01-25", priority: "high", status: "open", type: "request" },
  { id: "3", title: "Revisão de contrato para expansão", description: "Fintech Solutions quer expandir o contrato. Preparar proposta comercial.", company: "Fintech Solutions", assignedToId: "3", createdBy: "Admin", createdAt: "2026-01-20T10:00:00", dueDate: "2026-01-24", priority: "high", status: "in_progress", type: "request" },
  { id: "4", title: "Bug reportado em integração", description: "LogiTech reportou erro na integração com ERP. Alinhar com time técnico.", company: "LogiTech", assignedToId: null, createdBy: "Admin", createdAt: "2026-01-22T09:30:00", dueDate: "2026-01-23", priority: "urgent", status: "open", type: "support" },
  { id: "5", title: "Preparar material para QBR", description: "Preparar apresentação do QBR para todas as contas enterprise.", company: "", assignedToId: null, createdBy: "Líder", createdAt: "2026-01-19T16:00:00", dueDate: "2026-01-28", priority: "medium", status: "open", type: "internal" },
];

export const mockChecklistItems: ChecklistItem[] = [
  { id: "1", csOwnerId: "1", title: "Revisar alertas críticos", description: "Verificar contas com health score abaixo de 40", completed: true, priority: "high", date: "2026-01-22" },
  { id: "2", csOwnerId: "1", title: "Responder grupos de WhatsApp", description: "Máximo 2h de SLA", completed: true, priority: "high", date: "2026-01-22" },
  { id: "3", csOwnerId: "1", title: "Followups do dia", description: "3 followups pendentes", completed: false, priority: "high", date: "2026-01-22" },
  { id: "4", csOwnerId: "1", title: "Atualizar status das entregas", description: "Sincronizar com squads", completed: false, priority: "medium", date: "2026-01-22" },
  { id: "5", csOwnerId: "2", title: "Revisar alertas críticos", completed: true, priority: "high", date: "2026-01-22" },
  { id: "6", csOwnerId: "2", title: "Responder grupos de WhatsApp", completed: false, priority: "high", date: "2026-01-22" },
  { id: "7", csOwnerId: "3", title: "Revisar alertas críticos", completed: false, priority: "high", date: "2026-01-22" },
  { id: "8", csOwnerId: "3", title: "Responder grupos de WhatsApp", completed: false, priority: "high", date: "2026-01-22" },
];

export const mockWhatsAppGroups: WhatsAppGroup[] = [
  { id: "1", csOwnerId: "1", name: "TechCorp - Projeto ICIA", company: "TechCorp Brasil", lastMessage: "Conseguimos resolver o bug de integração!", lastMessageTime: "2026-01-22T10:30:00", unreadCount: 3, members: 8 },
  { id: "2", csOwnerId: "1", name: "HealthPlus - Suporte", company: "HealthPlus", lastMessage: "Obrigado pelo retorno rápido!", lastMessageTime: "2026-01-22T09:15:00", unreadCount: 0, members: 5 },
  { id: "3", csOwnerId: "2", name: "Varejo Express - CS", company: "Varejo Express", lastMessage: "Quando podemos agendar o treinamento?", lastMessageTime: "2026-01-22T09:15:00", unreadCount: 1, members: 5 },
  { id: "4", csOwnerId: "2", name: "EduTech - Implementação", company: "EduTech", lastMessage: "Perfeito, aguardamos o material", lastMessageTime: "2026-01-21T18:45:00", unreadCount: 0, members: 6 },
  { id: "5", csOwnerId: "3", name: "Fintech Solutions - CS", company: "Fintech Solutions", lastMessage: "Obrigado pelo material enviado!", lastMessageTime: "2026-01-21T18:45:00", unreadCount: 0, members: 6 },
  { id: "6", csOwnerId: "3", name: "RetailMax - Suporte", company: "RetailMax", lastMessage: "Vamos precisar de uma call amanhã", lastMessageTime: "2026-01-21T16:20:00", unreadCount: 2, members: 7 },
];

export function getCSOwnerById(id: string): CSOwner | undefined {
  return mockCSOwners.find(cs => cs.id === id);
}

export function getActivitiesByCSOwner(csOwnerId: string): TeamActivity[] {
  return mockTeamActivities.filter(a => a.csOwnerId === csOwnerId);
}

export function getPendingsByCSOwner(csOwnerId: string): Pending[] {
  return mockPendings.filter(p => p.csOwnerId === csOwnerId);
}

export function getDemandsByCSOwner(csOwnerId: string): Demand[] {
  return mockDemands.filter(d => d.assignedToId === csOwnerId);
}

export function getChecklistByCSOwner(csOwnerId: string): ChecklistItem[] {
  return mockChecklistItems.filter(c => c.csOwnerId === csOwnerId);
}

export function getWhatsAppGroupsByCSOwner(csOwnerId: string): WhatsAppGroup[] {
  return mockWhatsAppGroups.filter(g => g.csOwnerId === csOwnerId);
}

export interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  estimatedMinutes?: number;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
  category: "daily" | "weekly" | "onboarding" | "nutrition" | "research" | "custom";
  tasks: TemplateTask[];
  createdBy: string;
  createdAt: string;
  isDefault: boolean;
}

export interface AppliedTemplate {
  id: string;
  templateId: string;
  templateName: string;
  assignedToId: string | null;
  assignedToSquad: string | null;
  appliedBy: string;
  appliedAt: string;
  dueDate: string;
  status: "active" | "completed" | "cancelled";
  completedTasks: number;
  totalTasks: number;
}

export const mockSquads = [
  { id: "1", name: "Squad Alpha", members: ["1", "2"] },
  { id: "2", name: "Squad Beta", members: ["3", "4"] },
  { id: "3", name: "Squad Enterprise", members: ["5", "6"] },
];

export const mockTemplates: ActivityTemplate[] = [
  {
    id: "1",
    name: "Rotina Diária CS",
    description: "Checklist padrão para execução diária do time de CS",
    category: "daily",
    tasks: [
      { id: "1-1", title: "Revisar alertas críticos", description: "Verificar contas com health score abaixo de 40", priority: "high", estimatedMinutes: 15 },
      { id: "1-2", title: "Responder grupos de WhatsApp", description: "Máximo 2h de SLA para respostas", priority: "high", estimatedMinutes: 30 },
      { id: "1-3", title: "Executar followups do dia", description: "Realizar todas as ligações e emails programados", priority: "high", estimatedMinutes: 60 },
      { id: "1-4", title: "Atualizar status das entregas", description: "Sincronizar com squads de delivery", priority: "medium", estimatedMinutes: 20 },
      { id: "1-5", title: "Revisar NPS pendentes", description: "Analisar e responder feedbacks", priority: "low", estimatedMinutes: 15 },
    ],
    createdBy: "Sistema",
    createdAt: "2026-01-01T00:00:00",
    isDefault: true,
  },
  {
    id: "2",
    name: "Nutrição de Clientes",
    description: "Atividades para nutrir e engajar a base de clientes",
    category: "nutrition",
    tasks: [
      { id: "2-1", title: "Enviar conteúdo semanal", description: "Newsletter ou material relevante para o cliente", priority: "medium", estimatedMinutes: 20 },
      { id: "2-2", title: "Compartilhar case de sucesso", description: "Enviar case relevante do setor do cliente", priority: "medium", estimatedMinutes: 15 },
      { id: "2-3", title: "Check-in de satisfação", description: "Mensagem perguntando como estão as coisas", priority: "high", estimatedMinutes: 10 },
      { id: "2-4", title: "Enviar dica de uso", description: "Tip rápido sobre feature do produto", priority: "low", estimatedMinutes: 10 },
      { id: "2-5", title: "Convidar para webinar", description: "Enviar convite para próximo evento", priority: "low", estimatedMinutes: 5 },
    ],
    createdBy: "Sistema",
    createdAt: "2026-01-01T00:00:00",
    isDefault: true,
  },
  {
    id: "3",
    name: "Pesquisa de Satisfação",
    description: "Processo completo para rodar pesquisa NPS/CSAT",
    category: "research",
    tasks: [
      { id: "3-1", title: "Preparar lista de clientes", description: "Selecionar clientes elegíveis para pesquisa", priority: "high", estimatedMinutes: 30 },
      { id: "3-2", title: "Personalizar mensagem", description: "Adaptar template de pesquisa", priority: "medium", estimatedMinutes: 15 },
      { id: "3-3", title: "Enviar pesquisa", description: "Disparar pesquisa para base selecionada", priority: "high", estimatedMinutes: 20 },
      { id: "3-4", title: "Acompanhar respostas", description: "Monitorar taxa de resposta", priority: "medium", estimatedMinutes: 10 },
      { id: "3-5", title: "Analisar resultados", description: "Compilar e analisar feedbacks", priority: "high", estimatedMinutes: 45 },
      { id: "3-6", title: "Criar plano de ação", description: "Definir ações para detratores", priority: "high", estimatedMinutes: 30 },
    ],
    createdBy: "Sistema",
    createdAt: "2026-01-01T00:00:00",
    isDefault: true,
  },
  {
    id: "4",
    name: "Monitoramento WhatsApp",
    description: "Rotina de acompanhamento dos grupos de clientes",
    category: "daily",
    tasks: [
      { id: "4-1", title: "Verificar mensagens não lidas", description: "Checar todos os grupos com mensagens pendentes", priority: "high", estimatedMinutes: 15 },
      { id: "4-2", title: "Responder dúvidas técnicas", description: "Resolver questões ou escalar para suporte", priority: "high", estimatedMinutes: 30 },
      { id: "4-3", title: "Identificar oportunidades", description: "Anotar possíveis upsells ou expansões", priority: "medium", estimatedMinutes: 10 },
      { id: "4-4", title: "Registrar feedbacks", description: "Documentar feedbacks relevantes", priority: "medium", estimatedMinutes: 15 },
      { id: "4-5", title: "Escalar problemas críticos", description: "Reportar issues urgentes para liderança", priority: "high", estimatedMinutes: 10 },
    ],
    createdBy: "Sistema",
    createdAt: "2026-01-01T00:00:00",
    isDefault: true,
  },
  {
    id: "5",
    name: "Onboarding Cliente",
    description: "Checklist completo para onboarding de novos clientes",
    category: "onboarding",
    tasks: [
      { id: "5-1", title: "Call de kickoff", description: "Reunião inicial com stakeholders", priority: "high", estimatedMinutes: 60 },
      { id: "5-2", title: "Criar grupo WhatsApp", description: "Adicionar todos os participantes", priority: "high", estimatedMinutes: 10 },
      { id: "5-3", title: "Enviar material de boas-vindas", description: "Kit com guias e tutoriais", priority: "high", estimatedMinutes: 15 },
      { id: "5-4", title: "Agendar treinamentos", description: "Definir cronograma de capacitação", priority: "high", estimatedMinutes: 20 },
      { id: "5-5", title: "Configurar acessos", description: "Garantir que todos tenham acesso à plataforma", priority: "high", estimatedMinutes: 30 },
      { id: "5-6", title: "Primeira reunião de acompanhamento", description: "Check-in após primeira semana", priority: "medium", estimatedMinutes: 45 },
    ],
    createdBy: "Sistema",
    createdAt: "2026-01-01T00:00:00",
    isDefault: true,
  },
  {
    id: "6",
    name: "Review Semanal de Contas",
    description: "Análise semanal da carteira de clientes",
    category: "weekly",
    tasks: [
      { id: "6-1", title: "Analisar health scores", description: "Revisar scores de todas as contas", priority: "high", estimatedMinutes: 30 },
      { id: "6-2", title: "Identificar contas em risco", description: "Listar clientes que precisam atenção", priority: "high", estimatedMinutes: 20 },
      { id: "6-3", title: "Planejar ações de retenção", description: "Definir estratégia para contas críticas", priority: "high", estimatedMinutes: 30 },
      { id: "6-4", title: "Mapear oportunidades de expansão", description: "Identificar potenciais upsells", priority: "medium", estimatedMinutes: 20 },
      { id: "6-5", title: "Atualizar CRM", description: "Registrar todas as interações da semana", priority: "medium", estimatedMinutes: 30 },
    ],
    createdBy: "Sistema",
    createdAt: "2026-01-01T00:00:00",
    isDefault: true,
  },
];

export const mockAppliedTemplates: AppliedTemplate[] = [
  { id: "1", templateId: "1", templateName: "Rotina Diária CS", assignedToId: "1", assignedToSquad: null, appliedBy: "Admin", appliedAt: "2026-01-22T08:00:00", dueDate: "2026-01-22", status: "active", completedTasks: 3, totalTasks: 5 },
  { id: "2", templateId: "1", templateName: "Rotina Diária CS", assignedToId: "2", assignedToSquad: null, appliedBy: "Admin", appliedAt: "2026-01-22T08:00:00", dueDate: "2026-01-22", status: "active", completedTasks: 2, totalTasks: 5 },
  { id: "3", templateId: "2", templateName: "Nutrição de Clientes", assignedToId: null, assignedToSquad: "1", appliedBy: "Admin", appliedAt: "2026-01-20T10:00:00", dueDate: "2026-01-24", status: "active", completedTasks: 2, totalTasks: 5 },
  { id: "4", templateId: "4", templateName: "Monitoramento WhatsApp", assignedToId: "3", assignedToSquad: null, appliedBy: "Admin", appliedAt: "2026-01-22T08:00:00", dueDate: "2026-01-22", status: "active", completedTasks: 1, totalTasks: 5 },
];

export function getTemplateById(id: string): ActivityTemplate | undefined {
  return mockTemplates.find(t => t.id === id);
}

export function getSquadById(id: string) {
  return mockSquads.find(s => s.id === id);
}
