import OpenAI from "openai";
import type { DiagnosticResponse } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_APIKEY,
});

interface TaskDetail {
  taskName: string;
  stepByStep: string;
  frequency: string;
  timePerExecution: string;
  peopleDoingSame: string;
  whereStarts: string;
  whereEnds: string;
  hasClearPattern: string;
  hasProcessOwner: string;
  canContinueIfOtherPerson: string;
  mainProblem: string;
  mainGainIfImproved: string;
  timeSavedPerWeek: string;
}

interface SystemsData {
  dailyTools: string[];
  indispensableSystems: string[];
  mainDataLocation: string[];
  hasIntegration: string;
  integrationDetails?: string;
  itBlocksAccess: string;
  itBlocksDetails?: string;
}

interface PriorityData {
  taskToEliminate: string;
  willingToTest: string;
  bestTimeForTest?: string;
  finalObservation?: string;
}

interface SuggestedIPC {
  name: string;
  area: string;
  description: string;
  howItWorks: string;
  useCases: string[];
  expectedBenefits: string[];
  complexity: "low" | "medium" | "high";
  priority: number;
}

interface SuggestedAutomation {
  name: string;
  area: string;
  description: string;
  howItWorks: string;
  tasksAutomated: string[];
  tools: string[];
  estimatedTimeSaved: string;
  expectedBenefits: string[];
  complexity: "low" | "medium" | "high";
  priority: number;
}

interface PriorityTask {
  task: string;
  reason: string;
  potentialSavings: string;
  frequency: string;
  peopleAffected: string;
}

interface EstimatedSavings {
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  mainAreas: string[];
}

interface AnalysisResult {
  summary: string;
  suggestedIPCs: SuggestedIPC[];
  suggestedAutomations: SuggestedAutomation[];
  priorityTasks: PriorityTask[];
  estimatedSavings: EstimatedSavings;
  presentationPrompt: string;
  rawAnalysis: string;
}

function formatResponseForAnalysis(response: DiagnosticResponse & { user: { name: string | null; email: string } | null }): string {
  const taskDetails = response.taskDetails as TaskDetail[] | null;
  const systemsData = response.systemsData as SystemsData | null;
  const priorityData = response.priorityData as PriorityData | null;

  let formatted = `
## Respondente: ${response.fullName}
- Cargo: ${response.position}
- Área: ${response.area}
- Tempo na empresa: ${response.timeInCompany}
- Participa diretamente dos processos: ${response.directlyInvolved}

### Tarefas Mais Repetidas
${response.topFiveTasks?.join(", ") || "Não informado"}

### Tarefas que Mais Consomem Tempo
${response.topTwoTimeTasks?.join(", ") || "Não informado"}

### Áreas de Problema
- Tarefa de copiar/colar: ${response.copyPasteTask || "Não informado"}
- Área com mais retrabalho: ${response.reworkArea || "Não informado"}
- Área com mais erros humanos: ${response.humanErrorArea || "Não informado"}
- Área de maior dependência: ${response.dependencyArea || "Não informado"}
- Maior frustração: ${response.frustration || "Não informado"}
`;

  if (taskDetails && taskDetails.length > 0) {
    formatted += `\n### Detalhes das Tarefas\n`;
    taskDetails.forEach((task, index) => {
      formatted += `
#### Tarefa ${index + 1}: ${task.taskName}
- Passo a passo: ${task.stepByStep}
- Frequência: ${task.frequency}
- Tempo por execução: ${task.timePerExecution}
- Pessoas fazendo igual: ${task.peopleDoingSame}
- Onde começa: ${task.whereStarts} → Onde termina: ${task.whereEnds}
- Tem padrão claro: ${task.hasClearPattern}
- Tem dono do processo: ${task.hasProcessOwner}
- Pode continuar com outra pessoa: ${task.canContinueIfOtherPerson}
- Maior problema: ${task.mainProblem}
- Maior ganho se melhorar: ${task.mainGainIfImproved}
- Tempo economizado por semana: ${task.timeSavedPerWeek}
`;
    });
  }

  if (systemsData) {
    formatted += `
### Sistemas e Ferramentas
- Ferramentas usadas diariamente: ${systemsData.dailyTools?.join(", ") || "Não informado"}
- Sistemas indispensáveis: ${systemsData.indispensableSystems?.join(", ") || "Não informado"}
- Localização dos dados principais: ${systemsData.mainDataLocation?.join(", ") || "Não informado"}
- Existe integração: ${systemsData.hasIntegration}${systemsData.integrationDetails ? ` - ${systemsData.integrationDetails}` : ""}
- TI trava acessos: ${systemsData.itBlocksAccess}${systemsData.itBlocksDetails ? ` - ${systemsData.itBlocksDetails}` : ""}
`;
  }

  if (priorityData) {
    formatted += `
### Prioridade e Validação
- Tarefa que eliminaria: ${priorityData.taskToEliminate || "Não informado"}
- Toparia participar de teste: ${priorityData.willingToTest}
${priorityData.bestTimeForTest ? `- Melhor horário para teste: ${priorityData.bestTimeForTest}` : ""}
${priorityData.finalObservation ? `- Observação final: ${priorityData.finalObservation}` : ""}
`;
  }

  return formatted;
}

export const diagnosticAIService = {
  async analyzeDiagnostic(
    companyName: string,
    responses: (DiagnosticResponse & { user: { id: string; name: string | null; email: string } | null })[]
  ): Promise<AnalysisResult> {
    const formattedResponses = responses.map(formatResponseForAnalysis).join("\n---\n");

    const prompt = `Você é um engenheiro de IA altamente capacitado, especialista em automação de processos, Custom GPTs (IPCs - Inteligências Personalizadas Customizadas) e transformação digital. Analise o diagnóstico operacional abaixo da empresa "${companyName}" e forneça recomendações detalhadas e práticas.

# DIAGNÓSTICO OPERACIONAL
${formattedResponses}

# INSTRUÇÕES
Com base nas respostas acima, forneça uma análise completa no seguinte formato JSON:

{
  "summary": "Resumo executivo de 3-5 parágrafos identificando os principais padrões, gargalos e oportunidades encontrados. Seja específico sobre as dores identificadas e o potencial de transformação.",
  
  "suggestedIPCs": [
    {
      "name": "Nome criativo e descritivo do IPC (Custom GPT)",
      "area": "Área da empresa que será beneficiada",
      "description": "Descrição completa do que é este IPC e como ele funciona como um 'ajudante inteligente' para a equipe",
      "howItWorks": "Explicação detalhada de como o IPC funciona no dia-a-dia: que tipo de perguntas responde, que tarefas auxilia, como interage com o usuário",
      "useCases": ["Caso de uso 1", "Caso de uso 2", "Caso de uso 3"],
      "expectedBenefits": ["Benefício 1", "Benefício 2", "Benefício 3"],
      "complexity": "low|medium|high",
      "priority": 1
    }
  ],
  
  "suggestedAutomations": [
    {
      "name": "Nome descritivo da automação",
      "area": "Área/departamento beneficiado",
      "description": "Descrição completa da automação e seu funcionamento",
      "howItWorks": "Explicação passo-a-passo de como a automação funciona: gatilhos, processos, resultados esperados",
      "tasksAutomated": ["Tarefa automatizada 1", "Tarefa automatizada 2"],
      "tools": ["Ferramenta 1", "Ferramenta 2"],
      "estimatedTimeSaved": "Tempo economizado por semana/mês",
      "expectedBenefits": ["Benefício 1", "Benefício 2", "Benefício 3"],
      "complexity": "low|medium|high",
      "priority": 1
    }
  ],
  
  "priorityTasks": [
    {
      "task": "Nome da tarefa prioritária",
      "reason": "Justificativa detalhada de por que deve ser priorizada",
      "potentialSavings": "Economia potencial em horas/semana",
      "frequency": "Frequência da tarefa",
      "peopleAffected": "Quantas pessoas são afetadas"
    }
  ],
  
  "estimatedSavings": {
    "weeklyHours": 0,
    "monthlyHours": 0,
    "yearlyHours": 0,
    "mainAreas": ["áreas com maior potencial de economia"]
  },
  
  "presentationPrompt": "Prompt completo e detalhado para gerar um documento de apresentação profissional para a reunião de Onboarding. O prompt deve instruir a IA a criar um documento visualmente atraente com: capa com nome da empresa, índice, resumo executivo, diagnóstico atual (dores identificadas), soluções propostas (IPCs e Automações) com explicações visuais, roadmap de implementação, estimativa de ROI, e próximos passos. O prompt deve ser escrito como se fosse para um designer/redator criar uma apresentação executiva de alto nível."
}

# REGRAS IMPORTANTES

## Para os IPCs (Custom GPTs):
- Gere EXATAMENTE 6 IPCs diferentes
- Cada IPC deve ser um "ajudante inteligente" específico para uma necessidade identificada
- Os nomes devem ser criativos e memoráveis (ex: "Assistente de Propostas", "Analista de Dados", "Suporte Técnico Inteligente")
- A descrição deve explicar claramente como o IPC ajuda no dia-a-dia
- Priorize IPCs que resolvam as maiores frustrações identificadas
- Ordene por prioridade (1 = mais prioritário)

## Para as Automações:
- Gere EXATAMENTE 6 automações diferentes
- Foque em automações práticas e implementáveis
- Considere as ferramentas que a empresa já usa
- Explique claramente o fluxo de funcionamento
- Ordene por prioridade (1 = mais prioritário)

## Para o Prompt de Apresentação:
- O prompt deve ser completo e detalhado (mínimo 500 palavras)
- Deve instruir a criação de uma apresentação executiva profissional
- Deve incluir todos os dados do diagnóstico de forma estruturada
- O resultado deve ser uma apresentação que impressione na reunião de Onboarding

Considere:
1. Tarefas repetitivas que Custom GPTs podem auxiliar (redação, análise, suporte)
2. Processos que podem ser automatizados com Make/Zapier/N8N
3. Integrações entre sistemas que eliminam trabalho manual
4. Chatbots internos para suporte e consultas
5. Automação de relatórios, e-mails e notificações
6. Processamento inteligente de documentos

Responda APENAS com o JSON, sem texto adicional.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em automação empresarial e IA. Responda apenas em JSON válido. Seja detalhado e completo em suas respostas.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 16000,
    });

    const rawAnalysis = completion.choices[0]?.message?.content || "{}";
    
    let analysis: Partial<AnalysisResult>;
    try {
      analysis = JSON.parse(rawAnalysis);
    } catch {
      analysis = {
        summary: "Erro ao processar análise. Por favor, tente novamente.",
        suggestedIPCs: [],
        suggestedAutomations: [],
        priorityTasks: [],
        estimatedSavings: {
          weeklyHours: 0,
          monthlyHours: 0,
          yearlyHours: 0,
          mainAreas: [],
        },
        presentationPrompt: "",
      };
    }

    return {
      summary: analysis.summary || "",
      suggestedIPCs: analysis.suggestedIPCs || [],
      suggestedAutomations: analysis.suggestedAutomations || [],
      priorityTasks: analysis.priorityTasks || [],
      estimatedSavings: analysis.estimatedSavings || {
        weeklyHours: 0,
        monthlyHours: 0,
        yearlyHours: 0,
        mainAreas: [],
      },
      presentationPrompt: analysis.presentationPrompt || "",
      rawAnalysis,
    };
  },
};
