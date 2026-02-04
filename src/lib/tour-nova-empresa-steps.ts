export type TourStep = {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
};

export const TOUR_NOVA_EMPRESA_STEPS: TourStep[] = [
  {
    id: "modos",
    targetSelector: "[data-tour=\"nova-empresa-modos\"]",
    title: "Como cadastrar",
    description:
      "Escolha entre importar do contrato (IA), CSV, cadastro rápido ou manual. Para controle total, use Cadastro manual.",
  },
  {
    id: "basics",
    targetSelector: "[data-tour=\"wizard-step-basics\"]",
    title: "Dados",
    description: "Preencha nome, segmento, framework e valores financeiros (MRR, faturamento, etc.).",
  },
  {
    id: "assignment",
    targetSelector: "[data-tour=\"wizard-step-assignment\"]",
    title: "Equipe",
    description: "Selecione o CS Owner e a Squad responsáveis pela empresa.",
  },
  {
    id: "deliveries",
    targetSelector: "[data-tour=\"wizard-step-deliveries\"]",
    title: "Entregas",
    description: "Cadastre os entregáveis: título, data, responsável, impacto e cadência.",
  },
  {
    id: "workshops",
    targetSelector: "[data-tour=\"wizard-step-workshops\"]",
    title: "Workshops",
    description: "Adicione workshops com data, duração, participantes e link Fathom (gravação).",
  },
  {
    id: "hotseats",
    targetSelector: "[data-tour=\"wizard-step-hotseats\"]",
    title: "Hotseats",
    description: "Adicione hotseats com as mesmas informações dos workshops.",
  },
  {
    id: "contacts",
    targetSelector: "[data-tour=\"wizard-step-contacts\"]",
    title: "Contatos",
    description: "Cadastre os contatos da empresa: nome, cargo, email, telefone e se é decisor.",
  },
  {
    id: "documents",
    targetSelector: "[data-tour=\"wizard-step-documents\"]",
    title: "Docs",
    description: "Anexe documentos e links (contrato, proposta, Fathom geral da empresa).",
  },
];

export const TOUR_STORAGE_KEY = "tour-nova-empresa-done";
export const TOUR_START_PARAM = "tour";
export const TOUR_START_STORAGE_KEY = "startTourNovaEmpresa";
