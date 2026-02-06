"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null; role: string };
}

interface DemandCommentsProps {
  demandId: string;
}

export function DemandComments({ demandId }: DemandCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/demands/${demandId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        setContent("");
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

      <div className="flex gap-2">
        <Textarea
          placeholder="Adicione um comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <Button onClick={handleSubmit} disabled={loading || !content.trim()} size="icon" className="shrink-0 h-10">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
