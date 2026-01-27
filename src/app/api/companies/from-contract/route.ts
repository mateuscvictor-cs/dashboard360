import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  processContractPDF,
  createCompanyFromContract,
} from "@/services/contract-extraction.service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as string | null;
    const csOwnerId = formData.get("csOwnerId") as string | null;
    const squadId = formData.get("squadId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo PDF é obrigatório" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Apenas arquivos PDF são aceitos" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (action === "extract") {
      const { extractedData, text } = await processContractPDF(buffer);
      return NextResponse.json({
        success: true,
        data: extractedData,
        textPreview: text.substring(0, 500) + "...",
      });
    }

    if (action === "create") {
      const extractedDataRaw = formData.get("extractedData") as string | null;
      
      if (!extractedDataRaw) {
        const { extractedData } = await processContractPDF(buffer);
        const company = await createCompanyFromContract(
          extractedData,
          csOwnerId || undefined,
          squadId || undefined
        );
        return NextResponse.json({
          success: true,
          company,
        });
      }

      const extractedData = JSON.parse(extractedDataRaw);
      const company = await createCompanyFromContract(
        extractedData,
        csOwnerId || undefined,
        squadId || undefined
      );

      return NextResponse.json({
        success: true,
        company,
      });
    }

    const { extractedData } = await processContractPDF(buffer);
    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("Erro ao processar contrato:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
