"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Send, Loader2, AtSign, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";

interface MentionableUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface CommentMention {
  mentionedUser: { id: string; name: string | null };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null; role: string };
  mentions: CommentMention[];
}

interface CompanyCommentsProps {
  companyId: string;
}

export function CompanyComments({ companyId }: CompanyCommentsProps) {
  const { data: session } = useSession();
  const currentUser = session?.user as { id: string; role: string } | undefined;
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionableUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(mentionQuery, 300);

  const fetchComments = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setFetching(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setMentionLoading(true);
      fetch(
        `/api/users/search?q=${encodeURIComponent(debouncedQuery)}&role=ADMIN,CS_OWNER&limit=8`
      )
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setMentionResults(Array.isArray(data) ? data : []))
        .finally(() => setMentionLoading(false));
    } else {
      setMentionResults([]);
    }
  }, [debouncedQuery]);

  const insertMention = useCallback(
    (user: MentionableUser) => {
      const before = content.substring(0, mentionStartIndex);
      const after = content.substring(textareaRef.current?.selectionStart ?? content.length);
      const mentionText = `@${user.name || user.email} `;
      const newContent = before + mentionText + after;
      setContent(newContent);
      setMentionIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
      setShowMentionDropdown(false);
      setMentionQuery("");
      setSelectedMentionIndex(0);
      setTimeout(() => {
        textareaRef.current?.focus();
        const pos = before.length + mentionText.length;
        textareaRef.current?.setSelectionRange(pos, pos);
      }, 0);
    },
    [content, mentionStartIndex]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showMentionDropdown || mentionResults.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((i) => Math.min(i + 1, mentionResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && mentionResults[selectedMentionIndex]) {
        e.preventDefault();
        insertMention(mentionResults[selectedMentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentionDropdown(false);
      }
    },
    [showMentionDropdown, mentionResults, selectedMentionIndex, insertMention]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    const cursor = e.target.selectionStart ?? v.length;
    setContent(v);

    const textBeforeCursor = v.substring(0, cursor);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!/\s/.test(afterAt)) {
        setShowMentionDropdown(true);
        setMentionStartIndex(lastAtIndex);
        setMentionQuery(afterAt);
        setSelectedMentionIndex(0);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, mentions: mentionIds }),
      });
      if (res.ok) {
        setContent("");
        setMentionIds([]);
        fetchComments();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao enviar comentário");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text: string, mentionList: CommentMention[]) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const mentionNames = new Map(mentionList.map((m) => [m.mentionedUser.name || m.mentionedUser.id, m.mentionedUser.id]));

    const regex = /@([^\s@]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      if (mentionNames.has(name)) {
        parts.push(text.slice(lastIndex, match.index));
        parts.push(
          <span
            key={match.index}
            className="rounded bg-primary/10 px-1 font-medium text-primary underline underline-offset-2 decoration-primary/60 cursor-default hover:bg-primary/15 transition-colors"
            title="Menção com notificação"
          >
            @{name}
          </span>
        );
        lastIndex = regex.lastIndex;
      }
    }
    parts.push(text.slice(lastIndex));
    return parts;
  };

  const canDeleteComment = (comment: Comment) => {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN") return true;
    if (currentUser.role === "CS_OWNER" && comment.author.id === currentUser.id) return true;
    return false;
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Excluir este comentário?")) return;
    try {
      const res = await fetch(`/api/companies/${companyId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchComments();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao excluir comentário");
      }
    } catch {
      alert("Erro ao excluir comentário");
    }
  };

  const getInitials = (name: string | null) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "?";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-medium">Comentários</h3>
        <Badge variant="secondary" className="text-xs">
          {comments.length}
        </Badge>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite seu comentário... Use @ para mencionar colegas"
          rows={3}
          className="pr-10"
        />
        {showMentionDropdown && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border bg-background shadow-lg"
          >
            {mentionLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : mentionResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Digite para buscar Admin ou CS
              </div>
            ) : (
              mentionResults.map((user, i) => (
                <button
                  key={user.id}
                  type="button"
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/80 ${
                    i === selectedMentionIndex ? "bg-muted" : ""
                  }`}
                  onMouseEnter={() => setSelectedMentionIndex(i)}
                  onClick={() => insertMention(user)}
                >
                  <AtSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user.name || user.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {user.role === "ADMIN" ? "Admin" : "CS"}
                  </Badge>
                </button>
              ))
            )}
          </div>
        )}
        <Button
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>Nenhum comentário ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              id={`comment-${comment.id}`}
              className="group rounded-lg border bg-muted/30 p-4 scroll-mt-24"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.author.image || undefined} />
                  <AvatarFallback className="text-xs">{getInitials(comment.author.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-sm font-medium">{comment.author.name || "Usuário"}</span>
                      <Badge variant="outline" className="text-xs">
                        {comment.author.role === "ADMIN" ? "Admin" : "CS"}
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
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                        aria-label="Excluir comentário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {renderContent(comment.content, comment.mentions)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
