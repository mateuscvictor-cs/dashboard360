export const SYSTEM_PROMPT = `Você é um analista de Customer Success experiente e estratégico. 
Sua função é analisar dados de clientes e operações para gerar insights acionáveis que ajudem a equipe de CS a:
- Prevenir churn
- Identificar oportunidades de expansão
- Melhorar a saúde dos clientes
- Otimizar a performance da equipe

Sempre responda em português brasileiro.
Seja direto, específico e acionável nas suas recomendações.
Base suas análises em evidências concretas dos dados fornecidos.`;

export const companyAnalysisPrompt = (data: {
  name: string;
  healthScore: number;
  healthStatus: string;
  mrr: number;
  lastInteraction: string | null;
  deliveries: { title: string; status: string; dueDate: string | null }[];
  contacts: { name: string; engagementLevel: string; lastContact: string | null }[];
  segment?: string;
  plan?: string;
}) => `
Analise os dados da empresa e gere insights acionáveis.

DADOS DA EMPRESA:
- Nome: ${data.name}
- Health Score: ${data.healthScore}/100
- Status de Saúde: ${data.healthStatus}
- MRR: R$ ${data.mrr.toLocaleString("pt-BR")}
- Segmento: ${data.segment || "Não informado"}
- Plano: ${data.plan || "Não informado"}
- Última interação: ${data.lastInteraction ? new Date(data.lastInteraction).toLocaleDateString("pt-BR") : "Sem registro"}

ENTREGAS:
${data.deliveries.length > 0 
  ? data.deliveries.map(d => `- ${d.title} (${d.status}) - Prazo: ${d.dueDate ? new Date(d.dueDate).toLocaleDateString("pt-BR") : "Sem prazo"}`).join("\n")
  : "Nenhuma entrega registrada"}

CONTATOS:
${data.contacts.length > 0
  ? data.contacts.map(c => `- ${c.name} (Engajamento: ${c.engagementLevel}) - Último contato: ${c.lastContact ? new Date(c.lastContact).toLocaleDateString("pt-BR") : "Nunca"}`).join("\n")
  : "Nenhum contato registrado"}

Gere de 1 a 3 insights no formato JSON:
{
  "insights": [{
    "insight": "descrição clara e específica do insight",
    "evidence": ["evidência 1 baseada nos dados", "evidência 2"],
    "actionSuggested": "ação específica e acionável",
    "expectedOutcome": "resultado esperado se a ação for tomada",
    "riskIfIgnored": "risco se o insight for ignorado",
    "confidence": "high" | "medium" | "low",
    "type": "recommendation" | "alert" | "opportunity" | "warning"
  }]
}

REGRAS:
- Insights devem ser específicos para esta empresa
- Evidências devem citar dados reais fornecidos
- Ações devem ser práticas e executáveis
- Priorize alertas se houver sinais de risco
- Identifique oportunidades se houver sinais positivos`;

export const csOwnerAnalysisPrompt = (data: {
  name: string;
  companiesCount: number;
  completedToday: number;
  pendingTasks: number;
  accountsAtRisk: number;
  companies: { name: string; healthStatus: string; healthScore: number }[];
}) => `
Analise a performance do CS Owner e gere insights para melhorar sua eficiência.

DADOS DO CS:
- Nome: ${data.name}
- Total de empresas: ${data.companiesCount}
- Tarefas concluídas hoje: ${data.completedToday}
- Tarefas pendentes: ${data.pendingTasks}
- Contas em risco: ${data.accountsAtRisk}

EMPRESAS ATRIBUÍDAS:
${data.companies.map(c => `- ${c.name}: ${c.healthStatus} (Score: ${c.healthScore})`).join("\n")}

Gere de 1 a 3 insights no formato JSON:
{
  "insights": [{
    "insight": "descrição clara e específica do insight",
    "evidence": ["evidência 1 baseada nos dados", "evidência 2"],
    "actionSuggested": "ação específica e acionável",
    "expectedOutcome": "resultado esperado se a ação for tomada",
    "riskIfIgnored": "risco se o insight for ignorado",
    "confidence": "high" | "medium" | "low",
    "type": "recommendation" | "alert" | "opportunity" | "warning"
  }]
}

REGRAS:
- Foque em produtividade e gestão de tempo
- Identifique sobrecarga se houver muitas contas em risco
- Sugira priorização de contas críticas
- Reconheça bom desempenho quando aplicável`;

export const portfolioAnalysisPrompt = (data: {
  totalCompanies: number;
  healthDistribution: { healthy: number; attention: number; risk: number; critical: number };
  totalMRR: number;
  csOwners: { name: string; companiesCount: number; accountsAtRisk: number }[];
  recentAlerts: { title: string; type: string }[];
}) => `
Analise a visão geral do portfólio e gere insights estratégicos.

RESUMO DO PORTFÓLIO:
- Total de empresas: ${data.totalCompanies}
- MRR total: R$ ${data.totalMRR.toLocaleString("pt-BR")}

DISTRIBUIÇÃO DE SAÚDE:
- Saudáveis: ${data.healthDistribution.healthy}
- Atenção: ${data.healthDistribution.attention}
- Risco: ${data.healthDistribution.risk}
- Críticas: ${data.healthDistribution.critical}

EQUIPE DE CS:
${data.csOwners.map(cs => `- ${cs.name}: ${cs.companiesCount} empresas, ${cs.accountsAtRisk} em risco`).join("\n")}

ALERTAS RECENTES:
${data.recentAlerts.length > 0
  ? data.recentAlerts.map(a => `- ${a.title} (${a.type})`).join("\n")
  : "Nenhum alerta recente"}

Gere de 2 a 4 insights estratégicos no formato JSON:
{
  "insights": [{
    "insight": "descrição clara e específica do insight",
    "evidence": ["evidência 1 baseada nos dados", "evidência 2"],
    "actionSuggested": "ação específica e acionável",
    "expectedOutcome": "resultado esperado se a ação for tomada",
    "riskIfIgnored": "risco se o insight for ignorado",
    "confidence": "high" | "medium" | "low",
    "type": "recommendation" | "alert" | "opportunity" | "trend" | "warning"
  }]
}

REGRAS:
- Foque em tendências e padrões do portfólio
- Identifique riscos sistêmicos
- Sugira ações que impactem múltiplas contas
- Aponte oportunidades de escala`;
