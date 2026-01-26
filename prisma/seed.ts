import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning database...");
  
  await prisma.aIInsight.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.appliedTemplate.deleteMany();
  await prisma.templateTask.deleteMany();
  await prisma.activityTemplate.deleteMany();
  await prisma.whatsAppGroup.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.pending.deleteMany();
  await prisma.teamActivity.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.usageDataPoint.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.priorityItem.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.cSOwner.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  
  console.log("Database cleaned");
  console.log("Seeding database...");
  
  const adminPassword = await hashPassword("Admin@123");
  const csPassword = await hashPassword("Cs@123");
  const clientPassword = await hashPassword("Cliente@123");
  
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@vanguardia.com",
      name: "Administrador",
      role: "ADMIN",
      emailVerified: true,
      accounts: {
        create: {
          accountId: "admin@vanguardia.com",
          providerId: "credential",
          password: adminPassword,
        },
      },
    },
  });
  
  console.log("Admin user created: admin@vanguardia.com / Admin@123");

  const squad1 = await prisma.squad.create({
    data: {
      name: "Squad Alpha",
      capacity: 100,
      currentLoad: 65,
    },
  });

  const squad2 = await prisma.squad.create({
    data: {
      name: "Squad Beta",
      capacity: 100,
      currentLoad: 45,
    },
  });

  const squad3 = await prisma.squad.create({
    data: {
      name: "Squad Enterprise",
      capacity: 50,
      currentLoad: 80,
    },
  });

  console.log("Squads created");

  const csOwner1 = await prisma.cSOwner.create({
    data: {
      name: "Maria Oliveira",
      email: "maria@vanguardia.com",
      avatar: "MO",
      role: "Senior CS",
      status: "ONLINE",
      weeklyCompletion: 91,
      avgResponseTime: 2.5,
      npsScore: 72,
      accountsAtRisk: 1,
      user: {
        create: {
          email: "maria@vanguardia.com",
          name: "Maria Oliveira",
          role: "CS_OWNER",
          emailVerified: true,
          accounts: {
            create: {
              accountId: "maria@vanguardia.com",
              providerId: "credential",
              password: csPassword,
            },
          },
        },
      },
    },
  });

  const csOwner2 = await prisma.cSOwner.create({
    data: {
      name: "João Silva",
      email: "joao@vanguardia.com",
      avatar: "JS",
      role: "CS Owner",
      status: "ONLINE",
      weeklyCompletion: 85,
      avgResponseTime: 3.2,
      npsScore: 68,
      accountsAtRisk: 2,
      user: {
        create: {
          email: "joao@vanguardia.com",
          name: "João Silva",
          role: "CS_OWNER",
          emailVerified: true,
          accounts: {
            create: {
              accountId: "joao@vanguardia.com",
              providerId: "credential",
              password: csPassword,
            },
          },
        },
      },
    },
  });

  const csOwner3 = await prisma.cSOwner.create({
    data: {
      name: "Ana Santos",
      email: "ana@vanguardia.com",
      avatar: "AS",
      role: "CS Owner",
      status: "BUSY",
      weeklyCompletion: 78,
      avgResponseTime: 4.1,
      npsScore: 65,
      accountsAtRisk: 3,
      user: {
        create: {
          email: "ana@vanguardia.com",
          name: "Ana Santos",
          role: "CS_OWNER",
          emailVerified: true,
          accounts: {
            create: {
              accountId: "ana@vanguardia.com",
              providerId: "credential",
              password: csPassword,
            },
          },
        },
      },
    },
  });

  const csOwner4 = await prisma.cSOwner.create({
    data: {
      name: "Pedro Costa",
      email: "pedro@vanguardia.com",
      avatar: "PC",
      role: "Junior CS",
      status: "ONLINE",
      weeklyCompletion: 72,
      avgResponseTime: 5.0,
      npsScore: 61,
      accountsAtRisk: 2,
      user: {
        create: {
          email: "pedro@vanguardia.com",
          name: "Pedro Costa",
          role: "CS_OWNER",
          emailVerified: true,
          accounts: {
            create: {
              accountId: "pedro@vanguardia.com",
              providerId: "credential",
              password: csPassword,
            },
          },
        },
      },
    },
  });

  console.log("CS Owners created with users: senha Cs@123");

  await prisma.squadMember.createMany({
    data: [
      { squadId: squad1.id, csOwnerId: csOwner1.id },
      { squadId: squad1.id, csOwnerId: csOwner2.id },
      { squadId: squad2.id, csOwnerId: csOwner3.id },
      { squadId: squad3.id, csOwnerId: csOwner4.id },
    ],
  });

  console.log("Squad members assigned");

  const company1 = await prisma.company.create({
    data: {
      name: "TechCorp Brasil",
      segment: "Tecnologia",
      plan: "Enterprise",
      mrr: 15000,
      healthScore: 85,
      healthStatus: "HEALTHY",
      riskScore: 15,
      expansionScore: 72,
      adoptionScore: 88,
      tags: ["enterprise", "tech", "growth"],
      framework: "Growth Framework",
      workshopsCount: 4,
      hotseatsCount: 8,
      contractStart: new Date("2025-01-15"),
      contractEnd: new Date("2026-01-15"),
      onboardingStatus: "completed",
      csOwnerId: csOwner1.id,
      squadId: squad1.id,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "Startup X",
      segment: "SaaS",
      plan: "Scale",
      mrr: 5000,
      healthScore: 65,
      healthStatus: "ATTENTION",
      riskScore: 35,
      expansionScore: 45,
      adoptionScore: 60,
      tags: ["startup", "saas", "growing"],
      framework: "Startup Accelerator",
      workshopsCount: 2,
      hotseatsCount: 4,
      contractStart: new Date("2025-06-01"),
      contractEnd: new Date("2026-06-01"),
      onboardingStatus: "in_progress",
      csOwnerId: csOwner1.id,
      squadId: squad1.id,
    },
  });

  const company3 = await prisma.company.create({
    data: {
      name: "Indústria ABC",
      segment: "Manufatura",
      plan: "Enterprise",
      mrr: 25000,
      healthScore: 42,
      healthStatus: "RISK",
      riskScore: 58,
      expansionScore: 30,
      adoptionScore: 45,
      tags: ["enterprise", "industry", "at-risk"],
      framework: "Enterprise Framework",
      workshopsCount: 6,
      hotseatsCount: 12,
      contractStart: new Date("2024-03-01"),
      contractEnd: new Date("2026-03-01"),
      onboardingStatus: "completed",
      csOwnerId: csOwner2.id,
      squadId: squad1.id,
    },
  });

  const company4 = await prisma.company.create({
    data: {
      name: "E-commerce Plus",
      segment: "Varejo",
      plan: "Growth",
      mrr: 8000,
      healthScore: 78,
      healthStatus: "HEALTHY",
      riskScore: 22,
      expansionScore: 65,
      adoptionScore: 80,
      tags: ["ecommerce", "retail"],
      framework: "Growth Framework",
      workshopsCount: 3,
      hotseatsCount: 6,
      contractStart: new Date("2025-04-01"),
      contractEnd: new Date("2026-04-01"),
      onboardingStatus: "completed",
      csOwnerId: csOwner3.id,
      squadId: squad2.id,
    },
  });

  const company5 = await prisma.company.create({
    data: {
      name: "FinTech Solutions",
      segment: "Financeiro",
      plan: "Enterprise",
      mrr: 35000,
      healthScore: 28,
      healthStatus: "CRITICAL",
      riskScore: 72,
      expansionScore: 20,
      adoptionScore: 35,
      tags: ["fintech", "enterprise", "critical"],
      framework: "Enterprise Framework",
      workshopsCount: 8,
      hotseatsCount: 16,
      contractStart: new Date("2024-01-01"),
      contractEnd: new Date("2026-01-01"),
      onboardingStatus: "completed",
      csOwnerId: csOwner4.id,
      squadId: squad3.id,
    },
  });

  console.log("Companies created");

  const clientUser = await prisma.user.create({
    data: {
      email: "cliente@techcorp.com",
      name: "Carlos Mendes (Cliente)",
      role: "CLIENT",
      emailVerified: true,
      companyId: company1.id,
      accounts: {
        create: {
          accountId: "cliente@techcorp.com",
          providerId: "credential",
          password: clientPassword,
        },
      },
    },
  });
  
  console.log("Client user created: cliente@techcorp.com / Cliente@123");

  await prisma.contact.createMany({
    data: [
      { companyId: company1.id, name: "Carlos Mendes", email: "carlos@techcorp.com", role: "CEO", isDecisionMaker: true, engagementLevel: "HIGH" },
      { companyId: company1.id, name: "Patricia Lima", email: "patricia@techcorp.com", role: "CTO", isDecisionMaker: true, engagementLevel: "HIGH" },
      { companyId: company2.id, name: "Rafael Santos", email: "rafael@startupx.com", role: "Founder", isDecisionMaker: true, engagementLevel: "MEDIUM" },
      { companyId: company3.id, name: "Roberto Alves", email: "roberto@industriaabc.com", role: "Diretor", isDecisionMaker: true, engagementLevel: "LOW" },
      { companyId: company4.id, name: "Fernanda Costa", email: "fernanda@ecomplus.com", role: "Head of Ops", isDecisionMaker: true, engagementLevel: "HIGH" },
      { companyId: company5.id, name: "Lucas Ferreira", email: "lucas@fintechsol.com", role: "CEO", isDecisionMaker: true, engagementLevel: "LOW" },
    ],
  });

  console.log("Contacts created");

  await prisma.delivery.createMany({
    data: [
      { companyId: company1.id, title: "Implementação Módulo Analytics", status: "IN_PROGRESS", progress: 65, dueDate: new Date("2026-02-15"), assignee: "Time Tech", impact: "HIGH" },
      { companyId: company1.id, title: "Treinamento Equipe", status: "PENDING", progress: 0, dueDate: new Date("2026-02-28"), assignee: "Maria", impact: "MEDIUM" },
      { companyId: company2.id, title: "Setup Inicial", status: "IN_PROGRESS", progress: 80, dueDate: new Date("2026-02-10"), assignee: "João", impact: "HIGH" },
      { companyId: company3.id, title: "Migração de Dados", status: "BLOCKED", progress: 30, dueDate: new Date("2026-01-30"), assignee: "Time Data", impact: "URGENT" },
      { companyId: company5.id, title: "Auditoria de Segurança", status: "DELAYED", progress: 45, dueDate: new Date("2026-01-25"), assignee: "Time Sec", impact: "URGENT" },
    ],
  });

  console.log("Deliveries created");

  await prisma.teamActivity.createMany({
    data: [
      { csOwnerId: csOwner1.id, companyId: company1.id, type: "CALL", description: "Call de alinhamento mensal", duration: 45, outcome: "Cliente satisfeito, próximos passos definidos" },
      { csOwnerId: csOwner1.id, companyId: company2.id, type: "EMAIL", description: "Envio de material de onboarding" },
      { csOwnerId: csOwner2.id, companyId: company3.id, type: "MEETING", description: "Reunião de crise - baixa adoção", duration: 60, outcome: "Plano de ação criado" },
      { csOwnerId: csOwner3.id, companyId: company4.id, type: "WHATSAPP", description: "Suporte rápido sobre integração", duration: 15 },
      { csOwnerId: csOwner4.id, companyId: company5.id, type: "CALL", description: "Tentativa de contato - sem resposta", duration: 5 },
    ],
  });

  console.log("Activities created");

  await prisma.pending.createMany({
    data: [
      { csOwnerId: csOwner1.id, companyId: company1.id, type: "FOLLOWUP", title: "Follow-up pós reunião", dueDate: new Date("2026-01-25"), priority: "HIGH", status: "PENDING" },
      { csOwnerId: csOwner2.id, companyId: company3.id, type: "DELIVERY", title: "Acompanhar migração", dueDate: new Date("2026-01-22"), priority: "URGENT", status: "OVERDUE" },
      { csOwnerId: csOwner3.id, type: "CHECKLIST", title: "Revisar health scores", dueDate: new Date("2026-01-23"), priority: "MEDIUM", status: "PENDING" },
      { csOwnerId: csOwner4.id, companyId: company5.id, type: "FOLLOWUP", title: "Recontatar cliente", dueDate: new Date("2026-01-20"), priority: "URGENT", status: "OVERDUE" },
    ],
  });

  console.log("Pendings created");

  await prisma.demand.createMany({
    data: [
      { title: "Escalonamento - Indústria ABC", description: "Cliente insatisfeito com atrasos", type: "ESCALATION", priority: "URGENT", companyId: company3.id, assignedToId: csOwner2.id, dueDate: new Date("2026-01-24"), createdBy: "Sistema", status: "OPEN" },
      { title: "Suporte técnico - FinTech", description: "Problemas de integração API", type: "SUPPORT", priority: "HIGH", companyId: company5.id, assignedToId: csOwner4.id, dueDate: new Date("2026-01-25"), createdBy: "Cliente", status: "IN_PROGRESS" },
      { title: "Solicitação de expansão", description: "TechCorp quer adicionar mais usuários", type: "REQUEST", priority: "MEDIUM", companyId: company1.id, assignedToId: csOwner1.id, dueDate: new Date("2026-02-01"), createdBy: "CS", status: "OPEN" },
    ],
  });

  console.log("Demands created");

  await prisma.checklistItem.createMany({
    data: [
      { csOwnerId: csOwner1.id, title: "Revisar alertas críticos", priority: "HIGH", completed: true },
      { csOwnerId: csOwner1.id, title: "Responder grupos WhatsApp", priority: "HIGH", completed: true },
      { csOwnerId: csOwner1.id, title: "Executar followups do dia", priority: "HIGH", completed: false },
      { csOwnerId: csOwner1.id, title: "Atualizar status entregas", priority: "MEDIUM", completed: false },
      { csOwnerId: csOwner2.id, title: "Revisar alertas críticos", priority: "HIGH", completed: true },
      { csOwnerId: csOwner2.id, title: "Reunião com Indústria ABC", priority: "URGENT", completed: false },
    ],
  });

  console.log("Checklist items created");

  await prisma.whatsAppGroup.createMany({
    data: [
      { csOwnerId: csOwner1.id, companyId: company1.id, name: "TechCorp - Suporte", lastMessage: "Obrigado pelo retorno!", lastMessageTime: new Date(), unreadCount: 0, members: 5 },
      { csOwnerId: csOwner1.id, companyId: company2.id, name: "Startup X - Onboarding", lastMessage: "Quando podemos agendar?", lastMessageTime: new Date(), unreadCount: 3, members: 4 },
      { csOwnerId: csOwner2.id, companyId: company3.id, name: "Indústria ABC - Projeto", lastMessage: "Precisamos conversar urgente", lastMessageTime: new Date(), unreadCount: 8, members: 7 },
    ],
  });

  console.log("WhatsApp groups created");

  const template1 = await prisma.activityTemplate.create({
    data: {
      name: "Rotina Diária CS",
      description: "Checklist padrão para execução diária do time de CS",
      category: "DAILY",
      isDefault: true,
      createdBy: "Sistema",
      tasks: {
        create: [
          { title: "Revisar alertas críticos", description: "Verificar contas com health score abaixo de 40", priority: "HIGH", estimatedMinutes: 15, orderIndex: 0 },
          { title: "Responder grupos de WhatsApp", description: "Máximo 2h de SLA para respostas", priority: "HIGH", estimatedMinutes: 30, orderIndex: 1 },
          { title: "Executar followups do dia", description: "Realizar todas as ligações e emails programados", priority: "HIGH", estimatedMinutes: 60, orderIndex: 2 },
          { title: "Atualizar status das entregas", description: "Sincronizar com squads de delivery", priority: "MEDIUM", estimatedMinutes: 20, orderIndex: 3 },
          { title: "Revisar NPS pendentes", description: "Analisar e responder feedbacks", priority: "LOW", estimatedMinutes: 15, orderIndex: 4 },
        ],
      },
    },
  });

  const template2 = await prisma.activityTemplate.create({
    data: {
      name: "Nutrição de Clientes",
      description: "Atividades para nutrir e engajar a base de clientes",
      category: "NUTRITION",
      isDefault: true,
      createdBy: "Sistema",
      tasks: {
        create: [
          { title: "Enviar conteúdo semanal", description: "Newsletter ou material relevante", priority: "MEDIUM", estimatedMinutes: 20, orderIndex: 0 },
          { title: "Compartilhar case de sucesso", description: "Enviar case relevante do setor", priority: "MEDIUM", estimatedMinutes: 15, orderIndex: 1 },
          { title: "Check-in de satisfação", description: "Mensagem perguntando como estão as coisas", priority: "HIGH", estimatedMinutes: 10, orderIndex: 2 },
          { title: "Enviar dica de uso", description: "Tip rápido sobre feature do produto", priority: "LOW", estimatedMinutes: 10, orderIndex: 3 },
        ],
      },
    },
  });

  await prisma.activityTemplate.create({
    data: {
      name: "Pesquisa de Satisfação",
      description: "Processo completo para rodar pesquisa NPS/CSAT",
      category: "RESEARCH",
      isDefault: true,
      createdBy: "Sistema",
      tasks: {
        create: [
          { title: "Preparar lista de clientes", description: "Selecionar clientes elegíveis", priority: "HIGH", estimatedMinutes: 30, orderIndex: 0 },
          { title: "Personalizar mensagem", description: "Adaptar template de pesquisa", priority: "MEDIUM", estimatedMinutes: 15, orderIndex: 1 },
          { title: "Enviar pesquisa", description: "Disparar para base selecionada", priority: "HIGH", estimatedMinutes: 20, orderIndex: 2 },
          { title: "Acompanhar respostas", description: "Monitorar taxa de resposta", priority: "MEDIUM", estimatedMinutes: 10, orderIndex: 3 },
          { title: "Analisar resultados", description: "Compilar e analisar feedbacks", priority: "HIGH", estimatedMinutes: 45, orderIndex: 4 },
        ],
      },
    },
  });

  console.log("Templates created");

  await prisma.appliedTemplate.createMany({
    data: [
      { templateId: template1.id, assignedToId: csOwner1.id, dueDate: new Date("2026-01-23"), appliedBy: "Admin", completedTasks: 3, status: "ACTIVE" },
      { templateId: template1.id, assignedToId: csOwner2.id, dueDate: new Date("2026-01-23"), appliedBy: "Admin", completedTasks: 1, status: "ACTIVE" },
      { templateId: template2.id, assignedToSquadId: squad1.id, dueDate: new Date("2026-01-26"), appliedBy: "Admin", completedTasks: 0, status: "ACTIVE" },
    ],
  });

  console.log("Applied templates created");

  await prisma.alert.createMany({
    data: [
      { companyId: company3.id, type: "DELIVERY_DELAY", severity: "HIGH", title: "Entrega atrasada", description: "Migração de dados está 5 dias atrasada" },
      { companyId: company5.id, type: "CHURN_RISK", severity: "URGENT", title: "Risco de churn", description: "Cliente sem interação há 15 dias" },
      { companyId: company5.id, type: "NEGATIVE_SENTIMENT", severity: "HIGH", title: "Sentimento negativo", description: "Última interação foi negativa" },
      { companyId: company2.id, type: "ACTIVITY_DROP", severity: "MEDIUM", title: "Queda de atividade", description: "Uso caiu 30% na última semana" },
    ],
  });

  console.log("Alerts created");

  await prisma.aIInsight.createMany({
    data: [
      { companyId: company1.id, insight: "Cliente com alto potencial de expansão", evidence: ["Uso crescente", "Engajamento alto", "Feedback positivo"], source: "ML Model", confidence: "HIGH", actionSuggested: "Agendar call para discutir upgrade", expectedOutcome: "Aumento de 50% no MRR", riskIfIgnored: "Perder timing de expansão" },
      { companyId: company5.id, insight: "Alto risco de churn", evidence: ["Sem login há 10 dias", "Tickets não respondidos", "NPS detrator"], source: "Churn Predictor", confidence: "HIGH", actionSuggested: "Escalonar para liderança imediatamente", expectedOutcome: "Retenção do cliente", riskIfIgnored: "Perda de R$35k MRR" },
      { insight: "Maria Oliveira em alta performance", evidence: ["Taxa de conclusão 91%", "Tempo de resposta baixo", "NPS promotores"], source: "Performance Analyzer", confidence: "MEDIUM", actionSuggested: "Reconhecer publicamente", expectedOutcome: "Manter motivação da equipe" },
    ],
  });

  console.log("AI Insights created");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
