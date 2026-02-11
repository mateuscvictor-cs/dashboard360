const PROXY_MAX_BYTES = 4 * 1024 * 1024;

export interface UploadResult {
  readUrl: string;
  key: string;
  fileName: string;
}

export type UploadContext = "company-file" | "comment" | "resource";

async function uploadViaPresign(
  file: File,
  context: UploadContext,
  companyId?: string
): Promise<UploadResult> {
  const presignRes = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      context,
      companyId: companyId || undefined,
      fileSize: file.size,
    }),
  });
  if (!presignRes.ok) {
    const data = await presignRes.json();
    throw new Error(data.error ?? "Erro ao obter URL de upload");
  }
  const { uploadUrl, readUrl, key } = await presignRes.json();
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!putRes.ok) {
    throw new Error("Falha no upload direto (verifique CORS no bucket R2)");
  }
  return { readUrl, key, fileName: file.name };
}

async function uploadViaProxy(
  file: File,
  context: UploadContext,
  companyId?: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);
  if (companyId) formData.append("companyId", companyId);
  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Erro no upload");
  }
  const data = await res.json();
  return {
    readUrl: data.readUrl,
    key: data.key,
    fileName: data.fileName ?? file.name,
  };
}

export async function uploadFileToR2(
  file: File,
  context: UploadContext,
  companyId?: string
): Promise<UploadResult> {
  try {
    return await uploadViaPresign(file, context, companyId);
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError &&
      (err.message === "Failed to fetch" ||
        err.message.includes("NetworkError") ||
        err.message.includes("Load failed"));
    const isCorsOrPutFailure =
      err instanceof Error &&
      (err.message.includes("CORS") || err.message.includes("Falha no upload direto"));
    if ((isNetworkError || isCorsOrPutFailure) && file.size <= PROXY_MAX_BYTES) {
      return uploadViaProxy(file, context, companyId);
    }
    if (
      (isNetworkError || isCorsOrPutFailure) &&
      file.size > PROXY_MAX_BYTES
    ) {
      throw new Error(
        "Upload direto falhou (configure CORS no bucket R2 em Cloudflare) ou envie um arquivo de até 4MB."
      );
    }
    throw err;
  }
}
