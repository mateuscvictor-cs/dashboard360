"use client";

import { useState, useRef } from "react";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Reply,
  Send,
  Paperclip,
  Loader2,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadFileToR2 } from "@/lib/upload-to-r2";

interface CommentAttachment {
  fileName: string;
  url: string;
}

interface Comment {
  id: string;
  content: string;
  type: "COMMENT" | "CHANGE_REQUEST" | "APPROVAL" | "REJECTION" | "RESPONSE";
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
  };
  attachments?: CommentAttachment[] | null;
}

interface DeliveryCommentsProps {
  deliveryId: string;
  comments: Comment[];
  onRefresh: () => void;
  isClient?: boolean;
  apiBasePath?: string;
}

const typeConfig = {
  COMMENT: { icon: MessageSquare, label: "Comentário", color: "bg-gray-500/10 text-gray-600" },
  CHANGE_REQUEST: { icon: AlertTriangle, label: "Solicitação de Alteração", color: "bg-yellow-500/10 text-yellow-600" },
  APPROVAL: { icon: CheckCircle, label: "Aprovação", color: "bg-green-500/10 text-green-600" },
  REJECTION: { icon: XCircle, label: "Rejeição", color: "bg-red-500/10 text-red-600" },
  RESPONSE: { icon: Reply, label: "Resposta", color: "bg-blue-500/10 text-blue-600" },
};

export function DeliveryComments({
  deliveryId,
  comments,
  onRefresh,
  isClient = false,
  apiBasePath = "/api/deliveries",
}: DeliveryCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<"COMMENT" | "CHANGE_REQUEST" | "RESPONSE">(
    isClient ? "COMMENT" : "RESPONSE"
  );
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<CommentAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAttachment = async (file: File): Promise<CommentAttachment | null> => {
    const { readUrl, fileName } = await uploadFileToR2(file, "comment");
    return { fileName, url: readUrl };
  };

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
    if (!newComment.trim() && pendingAttachments.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiBasePath}/${deliveryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim() || " ",
          type: commentType,
          attachments: pendingAttachments,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setPendingAttachments([]);
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao enviar comentário");
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Erro ao enviar comentário");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-medium">Comunicação</h3>
        <Badge variant="secondary" className="text-xs">
          {comments.length}
        </Badge>
      </div>

      <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              isClient
                ? "Digite seu comentário ou solicitação..."
                : "Digite sua resposta..."
            }
            rows={3}
          />
            {!isClient && (
              <>
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
              </>
            )}
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isClient ? (
                <>
                  <Button
                    size="sm"
                    variant={commentType === "COMMENT" ? "secondary" : "ghost"}
                    onClick={() => setCommentType("COMMENT")}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Comentário
                  </Button>
                  <Button
                    size="sm"
                    variant={commentType === "CHANGE_REQUEST" ? "secondary" : "ghost"}
                    onClick={() => setCommentType("CHANGE_REQUEST")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Solicitar Alteração
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Resposta
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
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
                </>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || (!newComment.trim() && pendingAttachments.length === 0)}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum comentário ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const type = typeConfig[comment.type];
            const TypeIcon = type.icon;
            const isClientComment = comment.author.role === "CLIENT";

            return (
              <div
                key={comment.id}
                className={`p-4 rounded-lg border ${
                  isClientComment ? "bg-blue-500/5 border-blue-500/20" : "bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {comment.author.name || "Usuário"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${type.color}`}
                      >
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {type.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    {Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((att, idx) => (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
