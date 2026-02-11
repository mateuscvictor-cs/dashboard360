"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, ExternalLink, Trash2, Loader2, Download } from "lucide-react";
import { uploadFileToR2 } from "@/lib/upload-to-r2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompanyFileRecord {
  id: string;
  name: string;
  key: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string | null } | null;
}

interface CompanyFileManagerProps {
  companyId: string;
}

export function CompanyFileManager({ companyId }: CompanyFileManagerProps) {
  const [files, setFiles] = useState<CompanyFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao carregar arquivos");
      }
    } catch {
      setError("Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [companyId]);

  const uploadSingleFile = async (file: File): Promise<void> => {
    const { readUrl, key } = await uploadFileToR2(file, "company-file", companyId);
    const createRes = await fetch(`/api/companies/${companyId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        name: file.name,
        url: readUrl,
        size: file.size,
        mimeType: file.type || null,
      }),
    });
    if (!createRes.ok) {
      const data = await createRes.json();
      throw new Error(data.error ?? "Erro ao registrar arquivo");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < selected.length; i++) {
        await uploadSingleFile(selected[i]);
      }
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: string) => {
    setDeleting(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao remover");
      }
    } catch {
      setError("Erro ao remover arquivo");
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (bytes == null) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Arquivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">
              {uploading ? "Enviando..." : "Enviar arquivo(s)"}
            </span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Nenhum arquivo enviado. Use o botão acima para enviar.
          </p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)}
                      {file.uploadedBy?.name ? ` • ${file.uploadedBy.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <a
                      href={`/api/companies/${companyId}/files/${file.id}/download`}
                      download
                      aria-label="Baixar arquivo"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir arquivo">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(file.id)}
                    disabled={deleting === file.id}
                    aria-label="Remover arquivo"
                  >
                    {deleting === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
