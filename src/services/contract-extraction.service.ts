import OpenAI from "openai";
import { prisma } from "@/lib/db";
import {
  CONTRACT_EXTRACTION_SYSTEM_PROMPT,
  buildContractExtractionPrompt,
  type ExtractedContractData,
} from "@/lib/prompts/contract-extraction";
import type { MeetingRecurrence } from "@prisma/client";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_APIKEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_APIKEY não configurada");
  }
  return new OpenAI({ apiKey });
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const openai = getOpenAIClient();
    
    const uint8Array = new Uint8Array(buffer);
    const file = await openai.files.create({
      file: new File([uint8Array], "contract.pdf", { type: "application/pdf" }),
      purpose: "assistants",
    });

    let assistantId: string | undefined;

    try {
      const assistant = await openai.beta.assistants.create({
        name: "PDF Extractor",
        instructions: "Você extrai texto de PDFs. Retorne APENAS o texto extraído, sem formatação, sem comentários.",
        model: "gpt-4o",
        tools: [{ type: "code_interpreter" }],
      });
      assistantId = assistant.id;

      const run = await openai.beta.threads.createAndRunPoll({
        assistant_id: assistantId,
        thread: {
          messages: [
            {
              role: "user",
              content: "Extraia TODO o texto deste PDF. Retorne APENAS o texto puro, sem formatação adicional.",
              attachments: [
                {
                  file_id: file.id,
                  tools: [{ type: "code_interpreter" }],
                },
              ],
            },
          ],
        },
      });

      if (run.status !== "completed") {
        throw new Error(`Extração falhou: ${run.status}`);
      }

      const messages = await openai.beta.threads.messages.list(run.thread_id);
      const lastMessage = messages.data[0];
      
      if (!lastMessage || lastMessage.content[0].type !== "text") {
        throw new Error("Resposta não contém texto");
      }

      const extractedText = lastMessage.content[0].text.value;

      await openai.beta.assistants.delete(assistantId).catch(() => {});
      await openai.files.delete(file.id).catch(() => {});

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("Nenhum texto foi extraído do PDF");
      }

      return extractedText.trim();
    } catch (assistantError) {
      if (assistantId) {
        await openai.beta.assistants.delete(assistantId).catch(() => {});
      }
      await openai.files.delete(file.id).catch(() => {});
      throw assistantError;
    }
  } catch (error) {
    console.error("Erro ao extrair texto do PDF via OpenAI:", error);
    throw new Error(`Não foi possível extrair o texto do PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function extractContractData(
  contractText: string
): Promise<ExtractedContractData> {
  try {
    const openai = getOpenAIClient();
    const prompt = buildContractExtractionPrompt(contractText);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CONTRACT_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("IA não retornou resposta");
    }

    const parsed = JSON.parse(content) as ExtractedContractData;
    return validateAndNormalizeData(parsed);
  } catch (error) {
    console.error("Erro ao extrair dados do contrato:", error);
    throw new Error("Não foi possível extrair os dados do contrato");
  }
}

function validateAndNormalizeData(
  data: ExtractedContractData
): ExtractedContractData {
  return {
    contract: {
      title: data.contract?.title || null,
      term_months: typeof data.contract?.term_months === "number" ? data.contract.term_months : null,
      startDate: data.contract?.startDate || null,
      endDate: data.contract?.endDate || null,
      mrr: typeof data.contract?.mrr === "number" ? data.contract.mrr : null,
    },
    company: {
      name: data.company?.name || "Empresa sem nome",
      cnpj: data.company?.cnpj || null,
      segment: data.company?.segment || null,
    },
    contacts: Array.isArray(data.contacts)
      ? data.contacts.map((c) => ({
          name: c.name || "Contato",
          email: c.email || "",
          role: c.role || null,
          phone: c.phone?.replace(/\D/g, "") || null,
          isDecisionMaker: c.isDecisionMaker ?? false,
        }))
      : [],
    deliverables: Array.isArray(data.deliverables)
      ? data.deliverables.map((item, index) => ({
          id: item.id || `deliverable_${index}`,
          pillar: item.pillar || "Processos",
          name: item.name || "Entregável",
          description: item.description || null,
          delivery_mode: item.delivery_mode || null,
          frequency: item.frequency || null,
          quantity: typeof item.quantity === "number" ? item.quantity : null,
          quantity_min: typeof item.quantity_min === "number" ? item.quantity_min : null,
          quantity_max: typeof item.quantity_max === "number" ? item.quantity_max : null,
          unit: item.unit || null,
          expected_count: typeof item.expected_count === "number" ? item.expected_count : null,
          duration_hours: typeof item.duration_hours === "number" ? item.duration_hours : null,
          condition: item.condition || null,
          parent_id: item.parent_id || null,
          source_excerpt: item.source_excerpt || "",
        }))
      : [],
    plan: data.plan || null,
    additionalNotes: data.additionalNotes || null,
  };
}

const recurrenceMap: Record<string, MeetingRecurrence> = {
  weekly: "WEEKLY",
  biweekly: "BIWEEKLY",
  quinzenal: "BIWEEKLY",
  monthly: "MONTHLY",
  mensal: "MONTHLY",
  quarterly: "QUARTERLY",
  trimestral: "QUARTERLY",
};

function countByType(deliverables: ExtractedContractData["deliverables"], type: string): number {
  return deliverables.filter((d) => 
    d.name.toLowerCase().includes(type.toLowerCase()) || 
    d.pillar === type
  ).length;
}

export async function createCompanyFromContract(
  data: ExtractedContractData,
  csOwnerId?: string,
  squadId?: string
) {
  const workshopsCount = countByType(data.deliverables, "workshop");
  const hotseatsCount = countByType(data.deliverables, "hotseat");
  const ipcsCount = data.deliverables.filter((d) => 
    d.name.toLowerCase().includes("ipc") || 
    d.name.toLowerCase().includes("gpt") ||
    d.name.toLowerCase().includes("agente")
  ).length;
  const meetingsCount = data.deliverables.filter((d) => 
    d.frequency !== null
  ).reduce((acc, d) => acc + (d.expected_count || d.quantity || 1), 0);

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.company.name,
        cnpj: data.company.cnpj,
        segment: data.company.segment,
        plan: data.plan,
        mrr: data.contract.mrr || 0,
        contractStart: data.contract.startDate
          ? new Date(data.contract.startDate)
          : null,
        contractEnd: data.contract.endDate
          ? new Date(data.contract.endDate)
          : null,
        workshopsCount,
        hotseatsCount,
        ipcsCount,
        meetingsCount,
        csOwnerId,
        squadId,
        onboardingStatus: "NOVO",
      },
    });

    if (data.contacts.length > 0) {
      await tx.contact.createMany({
        data: data.contacts
          .filter((c) => c.email)
          .map((contact) => ({
            name: contact.name,
            email: contact.email,
            role: contact.role,
            phone: contact.phone,
            isDecisionMaker: contact.isDecisionMaker,
            companyId: company.id,
          })),
      });
    }

    const deliveryItems = data.deliverables.filter(
      (item) => item.pillar === "Processos" && !item.name.toLowerCase().includes("workshop") && !item.name.toLowerCase().includes("hotseat")
    );
    if (deliveryItems.length > 0) {
      await tx.delivery.createMany({
        data: deliveryItems.map((item) => ({
          title: item.name,
          companyId: company.id,
        })),
      });
    }

    const workshopItems = data.deliverables.filter(
      (item) => item.name.toLowerCase().includes("workshop") || item.pillar === "Pessoas"
    );
    for (const item of workshopItems) {
      await tx.workshop.create({
        data: {
          title: item.name,
          description: item.description,
          date: new Date(),
          companyId: company.id,
        },
      });
    }

    const hotseatItems = data.deliverables.filter(
      (item) => item.name.toLowerCase().includes("hotseat")
    );
    for (const item of hotseatItems) {
      await tx.hotseat.create({
        data: {
          title: item.name,
          description: item.description,
          date: new Date(),
          companyId: company.id,
        },
      });
    }

    const ipcItems = data.deliverables.filter(
      (item) => item.name.toLowerCase().includes("ipc") || 
                item.name.toLowerCase().includes("gpt") ||
                item.name.toLowerCase().includes("agente") ||
                item.pillar === "Tecnologia"
    );
    if (ipcItems.length > 0) {
      await tx.iPC.createMany({
        data: ipcItems.map((item) => ({
          title: item.name,
          description: item.description,
          companyId: company.id,
        })),
      });
    }

    const meetingItems = data.deliverables.filter((item) => item.frequency !== null);
    for (const item of meetingItems) {
      const recurrence = item.frequency ? recurrenceMap[item.frequency.toLowerCase()] || "MONTHLY" : "MONTHLY";
      await tx.meeting.create({
        data: {
          title: item.name,
          description: item.description,
          date: data.contract.startDate
            ? new Date(data.contract.startDate)
            : new Date(),
          recurrence,
          companyId: company.id,
        },
      });
    }

    const createdCompany = await tx.company.findUnique({
      where: { id: company.id },
      include: {
        contacts: true,
        deliveries: true,
        workshops: true,
        hotseats: true,
        ipcs: true,
        meetings: true,
        csOwner: true,
        squad: true,
      },
    });

    return createdCompany;
  });
}

export async function processContractPDF(
  buffer: Buffer,
  _csOwnerId?: string,
  _squadId?: string
) {
  try {
    const openai = getOpenAIClient();
    
    const base64Pdf = buffer.toString("base64");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: CONTRACT_EXTRACTION_SYSTEM_PROMPT + "\n\nIMPORTANTE: Responda APENAS com o JSON, sem nenhum texto adicional, explicações ou markdown." 
        },
        { 
          role: "user", 
          content: [
            {
              type: "file",
              file: {
                filename: "contrato.pdf",
                file_data: `data:application/pdf;base64,${base64Pdf}`,
              },
            },
            {
              type: "text",
              text: buildContractExtractionPrompt("Analise o PDF anexado acima"),
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error("IA não retornou resposta");
    }
    
    console.log("Resposta da IA (primeiros 500 chars):", responseText.substring(0, 500));
    
    let parsed: ExtractedContractData;
    
    function tryParseJson(str: string): ExtractedContractData {
      const trimmed = str.trim();
      return JSON.parse(trimmed) as ExtractedContractData;
    }
    
    const jsonCodeBlock = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonCodeBlock) {
      try {
        parsed = tryParseJson(jsonCodeBlock[1]);
      } catch (e) {
        console.error("Erro ao parsear JSON do code block:", e);
        throw new Error("JSON inválido no code block");
      }
    } else {
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const jsonStr = responseText.slice(jsonStart, jsonEnd + 1);
          parsed = tryParseJson(jsonStr);
        } catch (e) {
          console.error("Erro ao parsear JSON extraído:", e);
          console.error("JSON tentado (primeiros 500 chars):", responseText.slice(jsonStart, Math.min(jsonStart + 500, jsonEnd + 1)));
          throw new Error("JSON inválido na resposta");
        }
      } else {
        try {
          parsed = tryParseJson(responseText);
        } catch (e) {
          console.error("Resposta completa (primeiros 1000 chars):", responseText.substring(0, 1000));
          throw new Error("Não foi possível extrair JSON da resposta - formato não reconhecido");
        }
      }
    }
    
    const data = validateAndNormalizeData(parsed);

    return { extractedData: data, text: responseText };
  } catch (error) {
    console.error("Erro ao processar PDF:", error);
    throw new Error(`Não foi possível processar o PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
