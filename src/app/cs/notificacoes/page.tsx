"use client";

import { useState, useEffect } from "react";
import { Send, Building2, User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TargetType = "company" | "user";

interface Company {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  companyId: string;
}

export default function CSNotificacoesPage() {
  const [targetType, setTargetType] = useState<TargetType>("company");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cs/empresas")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data || []);
        const allUsers: UserOption[] = [];
        data.forEach((company: { id: string; users: UserOption[] }) => {
          if (company.users) {
            company.users.forEach((user) => {
              allUsers.push({ ...user, companyId: company.id });
            });
          }
        });
        setUsers(allUsers);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!title.trim() || !message.trim()) {
      setError("Título e mensagem são obrigatórios");
      return;
    }

    if (!targetId) {
      setError("Selecione um destinatário");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          targetType,
          targetId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar notificação");
      }

      setSuccess(`Notificação enviada para ${data.count} usuário(s)`);
      setTitle("");
      setMessage("");
      setLink("");
      setTargetId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar notificação");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Enviar Notificações" subtitle="Envie mensagens para seus clientes" showFilters={false} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nova Notificação</CardTitle>
              <CardDescription>
                Envie mensagens para suas empresas ou usuários específicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Destinatário</label>
                  <div className="grid grid-cols-2 gap-3">
                    <TargetButton
                      icon={Building2}
                      label="Empresa"
                      description="Todos da empresa"
                      isActive={targetType === "company"}
                      onClick={() => {
                        setTargetType("company");
                        setTargetId("");
                      }}
                    />
                    <TargetButton
                      icon={User}
                      label="Usuário"
                      description="Um usuário específico"
                      isActive={targetType === "user"}
                      onClick={() => {
                        setTargetType("user");
                        setTargetId("");
                      }}
                    />
                  </div>
                </div>

                {targetType === "company" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Empresa</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === "user" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Usuário</label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="">Selecione um usuário</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Atualização importante"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Mensagem</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite a mensagem da notificação..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/500
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Link (opcional)</label>
                  <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/cliente/entregas"
                  />
                  <p className="text-xs text-muted-foreground">
                    Caminho relativo para onde a notificação deve levar
                  </p>
                </div>

                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
                    {success}
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Enviando..." : "Enviar Notificação"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TargetButton({
  icon: Icon,
  label,
  description,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
        isActive
          ? "border-primary bg-primary/5"
          : "border-transparent bg-muted hover:bg-muted/80"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}
