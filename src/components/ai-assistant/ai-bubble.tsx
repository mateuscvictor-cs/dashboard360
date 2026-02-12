"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  success?: boolean;
};

type ConversationContext = {
  previousAction: { action: string; params: Record<string, unknown> };
  previousMessage: string;
};

export function AIBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const body: { message: string; conversationContext?: ConversationContext } = { message: text };
    if (conversationContext) {
      body.conversationContext = conversationContext;
    }

    try {
      const res = await fetch("/api/ai-assistant/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success || !data.needsConfirmation) {
        setConversationContext(null);
      }
      if (data.needsConfirmation && data.parsedAction?.action && data.parsedAction.action !== "unknown") {
        setConversationContext({
          previousAction: data.parsedAction,
          previousMessage: text,
        });
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message || "Sem resposta.",
        success: data.success,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Erro de conexão. Tente novamente.",
        success: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {open && (
          <div
            className="absolute bottom-14 right-0 w-[380px] max-h-[600px] rounded-xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Assistente de IA"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Assistente</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto">
              <div className="p-4 space-y-4">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Digite um comando, por exemplo: &quot;Crie 3 tarefas para Empresa X com
                    prazo 20/02&quot; ou &quot;Cadastre a empresa ABC&quot;.
                  </p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.success === false
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite seu comando..."
                  rows={2}
                  className="min-h-[44px] max-h-[80px] resize-none"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="shrink-0 h-11 w-11"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        <Button
          size="icon"
          variant="default"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar assistente" : "Abrir assistente"}
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
