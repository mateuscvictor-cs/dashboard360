"use client";

import { useState, useEffect } from "react";
import { Send, Users, Building2, User, Megaphone } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TargetType = "broadcast" | "company" | "user";
type TargetRole = "ALL" | "CLIENT" | "CS_OWNER" | "ADMIN";

interface Company {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function AdminNotificacoesPage() {
  const [targetType, setTargetType] = useState<TargetType>("broadcast");
  const [targetRole, setTargetRole] = useState<TargetRole>("ALL");
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
    if (targetType === "company") {
      fetch("/api/companies?limit=100")
        .then((res) => res.json())
        .then((data) => setCompanies(Array.isArray(data) ? data : data.companies || []))
        .catch(console.error);
    } else if (targetType === "user") {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(Array.isArray(data) ? data : data.users || []))
        .catch(console.error);
    }
  }, [targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!title.trim() || !message.trim()) {
      setError("Título e mensagem são obrigatórios");
      return;
    }

    if ((targetType === "company" || targetType === "user") && !targetId) {
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
          targetId: targetId || undefined,
          targetRole: targetType === "broadcast" ? targetRole : undefined,
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
      <Header title="Enviar Notificações" showFilters={false} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nova Notificação</CardTitle>
              <CardDescription>
                Envie mensagens para clientes, CS ou toda a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Destinatário</label>
                  <div className="grid grid-cols-3 gap-3">
                    <TargetButton
                      icon={Megaphone}
                      label="Broadcast"
                      description="Enviar para vários"
                      isActive={targetType === "broadcast"}
                      onClick={() => {
                        setTargetType("broadcast");
                        setTargetId("");
                      }}
                    />
                    <TargetButton
                      icon={Building2}
                      label="Empresa"
                      description="Uma empresa"
                      isActive={targetType === "company"}
                      onClick={() => {
                        setTargetType("company");
                        setTargetId("");
                      }}
                    />
                    <TargetButton
                      icon={User}
                      label="Usuário"
                      description="Um usuário"
                      isActive={targetType === "user"}
                      onClick={() => {
                        setTargetType("user");
                        setTargetId("");
                      }}
                    />
                  </div>
                </div>

                {targetType === "broadcast" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Público-alvo</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["ALL", "CLIENT", "CS_OWNER", "ADMIN"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setTargetRole(role)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            targetRole === role
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          {role === "ALL" ? "Todos" : role === "CLIENT" ? "Clientes" : role === "CS_OWNER" ? "CS" : "Admins"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                    placeholder="Ex: Nova atualização disponível"
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
