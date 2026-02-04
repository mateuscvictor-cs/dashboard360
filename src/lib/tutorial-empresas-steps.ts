export type TutorialEmpresasStep = {
  id: number;
  title: string;
  action: string;
  whatYouWillSee: string[];
  route: string;
  openLinkPath: "" | "empresas" | "entregas";
  optional?: boolean;
};

export const TUTORIAL_EMPRESAS_STEPS: TutorialEmpresasStep[] = [
  {
    id: 1,
    title: "Login e painel",
    action: "Fazer login e acessar o painel (CS ou Admin).",
    whatYouWillSee: [
      "Sidebar à esquerda com o menu (Minha Área, Minhas Empresas, Entregas, Agenda, etc.).",
      "Área principal com o resumo do dia ou visão 360.",
    ],
    route: "/cs ou /admin",
    openLinkPath: "",
  },
  {
    id: 2,
    title: "Acesso à lista de empresas",
    action: "No menu lateral, clicar em Minhas Empresas (CS) ou Empresas (Admin).",
    whatYouWillSee: [
      "Abas Minhas e Todas (CS) ou listagem única (Admin).",
      "Campo de busca e cards com nome da empresa, segmento, health score e MRR.",
    ],
    route: "/cs/empresas ou /admin/empresas",
    openLinkPath: "empresas",
  },
  {
    id: 3,
    title: "Abrir uma empresa",
    action: "Clicar em um card de empresa (no CS, de preferência uma em que você seja responsável para ver \"Pode editar\").",
    whatYouWillSee: [
      "Quatro cards no topo: Health Score, Workshops, Hotseats, Última Interação.",
      "Badge \"Pode editar\" ou \"Somente visualização\" (CS).",
      "Botões Novo Workshop, Novo Hotseat e link para Onboarding.",
    ],
    route: "/cs/empresas/[id] ou /admin/empresas/[id]",
    openLinkPath: "empresas",
  },
  {
    id: 4,
    title: "Adicionar entregável",
    action: "No card Entregáveis, clicar em Adicionar. Preencher o modal Novo Entregável (título, status, impacto, data de entrega, responsável) e salvar.",
    whatYouWillSee: [
      "Modal com campos: Título, Status (Pendente, Em Progresso, etc.), Impacto (Alto, Médio, Baixo), Data de Entrega e Responsável.",
    ],
    route: "modal na página da empresa",
    openLinkPath: "empresas",
  },
  {
    id: 5,
    title: "Adicionar workshop",
    action: "Clicar em Novo Workshop. Preencher o modal: título/tema, descrição, data/hora/duração, participantes, local (online/presencial), link da reunião (se online), link do Fathom (gravação) e observações.",
    whatYouWillSee: [
      "Modal com Título, Descrição, Data, Horário, Duração, Participantes.",
      "Local (Online/Presencial), Link da Reunião e campo Link do Fathom (gravação).",
    ],
    route: "modal na página da empresa",
    openLinkPath: "empresas",
  },
  {
    id: 6,
    title: "Adicionar hotseat",
    action: "Clicar em Novo Hotseat. O modal é o mesmo do workshop (título, descrição, data, participantes, local, link da reunião, link do Fathom, observações).",
    whatYouWillSee: [
      "Mesmo layout do workshop: título, descrição, data/hora, participantes, local, link da reunião e Link do Fathom.",
    ],
    route: "modal na página da empresa",
    openLinkPath: "empresas",
  },
  {
    id: 7,
    title: "Adicionar contato",
    action: "No card Contatos, clicar em Adicionar. Preencher nome, cargo, email, telefone e marcar \"É decisor\" se aplicável.",
    whatYouWillSee: [
      "Modal com Nome, Cargo, Email, Telefone e checkbox \"É decisor\".",
    ],
    route: "modal na página da empresa",
    openLinkPath: "empresas",
  },
  {
    id: 8,
    title: "Logo e recursos (contrato / links)",
    action: "Rolar a página até Informações Gerais. Abaixo aparecem Logo da Empresa (upload) e o card Recursos. Em Recursos, adicionar um recurso tipo Link ou Documento – ex.: título \"Contrato\" e URL.",
    whatYouWillSee: [
      "Seção Logo da Empresa com área de upload.",
      "Card Recursos com botão para adicionar; tipos: Link, Documento, Vídeo, etc. Use Documento ou Link com título \"Contrato\" e URL.",
    ],
    route: "parte inferior da página da empresa",
    openLinkPath: "empresas",
  },
  {
    id: 9,
    title: "Onboarding",
    action: "Clicar no botão Onboarding na página da empresa.",
    whatYouWillSee: [
      "Lista de etapas (Criação de Grupo, Formulário de Diagnóstico, Reunião de Onboarding, personalizadas) com status e ordem.",
    ],
    route: "/cs/empresas/[id]/onboarding ou /admin/empresas/[id]/onboarding",
    openLinkPath: "empresas",
  },
  {
    id: 10,
    title: "Concluir uma entrega",
    action: "No card Entregáveis, em uma entrega não concluída, clicar em Concluir. Preencher o dialog (incluindo link Fathom da reunião, se houver).",
    whatYouWillSee: [
      "Dialog de conclusão com campos para link Fathom da gravação e observações.",
    ],
    route: "modal na página da empresa ou da entrega",
    openLinkPath: "empresas",
    optional: true,
  },
  {
    id: 11,
    title: "Detalhe de uma entrega",
    action: "No menu, clicar em Entregas. Na lista, abrir uma entrega. Gerenciar reuniões (com link Fathom), documentos e conclusão.",
    whatYouWillSee: [
      "Página da entrega com abas/seções: reuniões (com link Fathom), documentos, dependências, comentários.",
    ],
    route: "/cs/entregas/[id] ou /admin/entregas/[id]",
    openLinkPath: "entregas",
    optional: true,
  },
];

export function getTutorialEmpresasOpenLink(basePath: string, step: TutorialEmpresasStep): string {
  if (step.openLinkPath === "") return basePath;
  return `${basePath}/${step.openLinkPath}`;
}
