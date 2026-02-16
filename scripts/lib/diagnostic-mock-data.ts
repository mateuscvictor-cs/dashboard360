const AREAS = [
  "Financeiro", "Comercial", "Marketing", "Operações", "RH", "TI",
  "Atendimento", "Logística", "Jurídico", "Administrativo",
];

const POSITIONS = [
  "Analista", "Coordenador", "Gerente", "Assistente", "Especialista",
  "Supervisor", "Diretor", "Auxiliar",
];

const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Diego", "Elena", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Marina", "Nicolas", "Olívia", "Pedro",
  "Rafaela", "Samuel", "Tatiana", "Victor", "Vanessa", "William", "Yasmin", "Zeca",
  "Amanda", "Bernardo", "Cecília", "Daniel", "Eduarda", "Fernando", "Giovana",
  "Hugo", "Ingrid", "Júlio", "Larissa", "Marcelo", "Natália",
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa",
];

const TASKS = [
  "Preencher planilhas de controle", "Enviar relatórios por email", "Atualizar cadastros no sistema",
  "Conferir notas fiscais", "Responder emails de clientes", "Fazer follow-up de vendas",
  "Gerar relatórios gerenciais", "Conciliar pagamentos", "Atualizar status de pedidos",
  "Copiar dados entre sistemas", "Agendar reuniões", "Preparar apresentações",
  "Aprovar solicitações", "Enviar cobranças", "Cadastrar novos clientes",
  "Emitir boletos", "Controlar estoque", "Fazer cotações", "Organizar documentos", "Atender telefone",
];

const TOOLS = [
  "Excel", "Google Sheets", "ERP", "CRM", "WhatsApp", "Email", "SAP",
  "Power BI", "Notion", "Slack", "Teams", "Zoom", "Trello", "Asana",
  "Monday", "HubSpot", "Salesforce", "Zendesk", "Freshdesk", "Pipedrive",
];

const SYSTEMS = [
  "ERP interno", "CRM", "Sistema de RH", "Folha de pagamento",
  "Sistema financeiro", "Plataforma de vendas", "Sistema de estoque",
  "Portal do cliente", "Intranet", "Sistema de tickets",
];

const FRUSTRATIONS = [
  "Muita burocracia para aprovar coisas simples", "Sistemas que não conversam entre si",
  "Ter que fazer a mesma coisa várias vezes", "Falta de padrão nos processos",
  "Depender de outras áreas para tudo", "Retrabalho constante por erros de comunicação",
  "Perder tempo procurando informações", "Planilhas desatualizadas",
  "Muitos emails para resolver problemas simples", "Falta de autonomia para tomar decisões",
];

const PROBLEMS = [
  "Demora muito", "Muito manual", "Sujeito a erros", "Falta padronização",
  "Depende de outras pessoas", "Informação descentralizada", "Processo complexo demais", "Falta de visibilidade",
];

const GAINS = [
  "Economia de tempo", "Redução de erros", "Mais agilidade", "Melhor controle",
  "Menos retrabalho", "Mais produtividade", "Melhor comunicação", "Dados mais confiáveis",
];

const TIME_IN_COMPANY = [
  "Menos de 6 meses", "6 meses a 1 ano", "1 a 2 anos", "2 a 5 anos", "Mais de 5 anos",
];

const FREQUENCIES = [
  "Várias vezes ao dia", "Diariamente", "Algumas vezes por semana",
  "Semanalmente", "Quinzenalmente", "Mensalmente",
];

const EXECUTION_TIMES = [
  "Menos de 5 minutos", "5 a 15 minutos", "15 a 30 minutos",
  "30 minutos a 1 hora", "1 a 2 horas", "Mais de 2 horas",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateDiagnosticResponse(index: number) {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = randomItem(LAST_NAMES);
  const area = AREAS[index % AREAS.length];
  const position = randomItem(POSITIONS);
  const topFiveTasks = randomItems(TASKS, 5);
  const topTwoTimeTasks = randomItems(topFiveTasks, 2);
  const taskDetails = topTwoTimeTasks.map((taskName) => ({
    taskName,
    stepByStep: `1. Abrir o sistema\n2. Localizar os dados\n3. Processar as informações\n4. Validar os resultados\n5. Salvar e comunicar`,
    frequency: randomItem(FREQUENCIES),
    timePerExecution: randomItem(EXECUTION_TIMES),
    peopleDoingSame: String(Math.floor(Math.random() * 5) + 1),
    whereStarts: randomItem(["Email", "Sistema", "Planilha", "Chamado", "Reunião"]),
    whereEnds: randomItem(["Email", "Sistema", "Planilha", "Relatório", "Aprovação"]),
    hasClearPattern: randomItem(["Sim", "Não", "Parcialmente"]),
    hasProcessOwner: randomItem(["Sim", "Não"]),
    canContinueIfOtherPerson: randomItem(["Sim", "Não", "Com dificuldade"]),
    mainProblem: randomItem(PROBLEMS),
    mainGainIfImproved: randomItem(GAINS),
    timeSavedPerWeek: `${Math.floor(Math.random() * 5) + 1}h`,
  }));
  return {
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@empresa.com`,
    fullName: `${firstName} ${lastName}`,
    position: `${position} de ${area}`,
    area,
    timeInCompany: randomItem(TIME_IN_COMPANY),
    directlyInvolved: randomItem(["Sim", "Não", "Parcialmente"]),
    directManager: randomItem(["Sim", "Não"]),
    topFiveTasks,
    topTwoTimeTasks,
    copyPasteTask: randomItem(TASKS),
    reworkArea: randomItem(AREAS),
    humanErrorArea: randomItem(AREAS),
    dependencyArea: randomItem(AREAS),
    frustration: randomItem(FRUSTRATIONS),
    taskDetails,
    systemsData: {
      dailyTools: randomItems(TOOLS, 4),
      indispensableSystems: randomItems(SYSTEMS, 3),
      mainDataLocation: randomItems(["Planilhas", "ERP", "Email", "Pastas compartilhadas", "CRM"], 2),
      hasIntegration: randomItem(["Sim", "Não", "Parcialmente"]),
      integrationDetails: "Algumas integrações via API",
      itBlocksAccess: randomItem(["Sim", "Não", "Às vezes"]),
      itBlocksDetails: "Algumas ferramentas precisam de aprovação",
    },
    priorityData: {
      taskToEliminate: randomItem(topTwoTimeTasks),
      willingToTest: "Sim",
      bestTimeForTest: "Manhã",
      finalObservation: "Gostaria de ter mais automação nos processos repetitivos",
    },
  };
}
