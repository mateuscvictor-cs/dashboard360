import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import {
  uploadFromBuffer,
  isR2Configured,
  type PresignContext,
} from "@/lib/r2";

const ALLOWED_CONTEXTS: PresignContext[] = [
  "company-file",
  "comment",
  "resource",
];

const MAX_PROXY_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/webm",
];

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Storage não configurado" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const context = formData.get("context") as string | null;
    const companyId = (formData.get("companyId") as string) || undefined;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Arquivo é obrigatório" },
        { status: 400 }
      );
    }
    if (!context || !ALLOWED_CONTEXTS.includes(context as PresignContext)) {
      return NextResponse.json(
        { error: "context inválido (company-file, comment ou resource)" },
        { status: 400 }
      );
    }
    if (
      (context === "company-file" || context === "resource") &&
      !companyId
    ) {
      return NextResponse.json(
        { error: "companyId é obrigatório para este context" },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROXY_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Arquivo excede 25MB. Use upload direto (configure CORS no bucket R2) ou envie um arquivo menor.`,
        },
        { status: 400 }
      );
    }

    const contentType =
      file.type?.split(";")[0].trim().toLowerCase() ||
      "application/octet-stream";
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadFromBuffer(
      file.name,
      contentType,
      buffer,
      context as PresignContext,
      companyId
    );

    if (!result) {
      return NextResponse.json(
        { error: "Erro ao enviar arquivo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      readUrl: result.readUrl,
      key: result.key,
      fileName: file.name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro no upload proxy:", error);
    return NextResponse.json(
      { error: "Erro ao enviar arquivo" },
      { status: 500 }
    );
  }
}
