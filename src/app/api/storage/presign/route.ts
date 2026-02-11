import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import {
  createPresignedUpload,
  isR2Configured,
  type PresignContext,
} from "@/lib/r2";

const ALLOWED_CONTEXTS: PresignContext[] = [
  "company-file",
  "comment",
  "resource",
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
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
    const body = await request.json();
    const {
      fileName,
      contentType,
      context,
      companyId,
      fileSize,
    }: {
      fileName?: string;
      contentType?: string;
      context?: string;
      companyId?: string;
      fileSize?: number;
    } = body;

    if (
      !fileName ||
      typeof fileName !== "string" ||
      !contentType ||
      typeof contentType !== "string" ||
      !context ||
      !ALLOWED_CONTEXTS.includes(context as PresignContext)
    ) {
      return NextResponse.json(
        { error: "fileName, contentType e context são obrigatórios" },
        { status: 400 }
      );
    }

    if (fileSize != null && fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo excede o tamanho máximo permitido (25MB)" },
        { status: 400 }
      );
    }

    const normalizedType = contentType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido" },
        { status: 400 }
      );
    }

    if (
      (context === "company-file" || context === "resource") &&
      (!companyId || typeof companyId !== "string")
    ) {
      return NextResponse.json(
        { error: "companyId é obrigatório para este context" },
        { status: 400 }
      );
    }

    const result = await createPresignedUpload(
      fileName,
      normalizedType,
      context as PresignContext,
      companyId
    );

    if (!result) {
      return NextResponse.json(
        { error: "Erro ao gerar URL de upload" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Erro ao gerar presign:", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL de upload" },
      { status: 500 }
    );
  }
}
