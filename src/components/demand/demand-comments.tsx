"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MessageSquare, Send, Loader2, Paperclip, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadFileToR2 } from "@/lib/upload-to-r2";

interface CommentAttachment {
  fileName: string;
  url: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null; role: string };
  attachments?: CommentAttachment[] | null;
}

interface DemandCommentsProps {
  demandId: string;
}

export function DemandComments({ demandId }: DemandCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<CommentAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAttachment = async (file: File): Promise<CommentAttachment | null> => {
    const { readUrl, fileName } = await uploadFileToR2(file, "comment");
    return { fileName, url: readUrl };
  };

  const fetchComments = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/demands/${demandId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setFetching(false);
    }
  }, [demandId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    setUploadingAttachment(true);
    try {
      for (let i = 0; i < selected.length; i++) {
        const att = await uploadAttachment(selected[i]);
        if (att) setPendingAttachments((prev) => [...prev, att]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao anexar");
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if ((!trimmed && pendingAttachments.length === 0) || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/demands/${demandId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed || " ",
          attachments: pendingAttachments,
        }),
      });
      if (res.ok) {
        setContent("");
        setPendingAttachments([]);
        fetchComments();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao enviar comentário");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="font-medium">Comentários ({comments.length})</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFileAttach}
        disabled={uploadingAttachment}
      />
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingAttachments.map((att, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs"
            >
              <span className="truncate max-w-[120px]">{att.fileName}</span>
              <button
                type="button"
                onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Remover anexo"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          placeholder="Adicione um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAttachment}
          aria-label="Anexar arquivo"
        >
          {uploadingAttachment ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>
        <Button onClick={handleSubmit} disabled={loading || (!content.trim() && pendingAttachments.length === 0)} size="icon" className="shrink-0 h-10">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {fetching ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.author.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(c.author.name ?? "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.author.name ?? "Usuário"}</span>
                  <span>{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {c.attachments.map((att, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <a
                          href={`/api/storage/download?url=${encodeURIComponent(att.url)}&filename=${encodeURIComponent(att.fileName)}`}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          {att.fileName}
                        </a>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:underline"
                          aria-label="Abrir em nova aba"
                        >
                          Abrir
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
