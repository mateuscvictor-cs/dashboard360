"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  UserPlus,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
  X,
  Search,
  AlertCircle,
  Shield,
  Headphones,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatRelativeTime } from "@/lib/utils";

type InviteType = "COMPANY_ADMIN" | "MEMBER_ADMIN" | "MEMBER_CS";
type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";

interface Invite {
  id: string;
  email: string;
  type: InviteType;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  company: { id: string; name: string } | null;
  invitedBy: { id: string; name: string; email: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  company: { id: string; name: string } | null;
  csOwner: { id: string; name: string } | null;
}

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  segment: string | null;
  users: { id: string }[];
}

interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
}

export default function AcessosPage() {
  const [activeTab, setActiveTab] = useState("invites");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [inviteForm, setInviteForm] = useState({
    email: "",
    type: "COMPANY_ADMIN" as InviteType,
    companyId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invitesRes, usersRes, companiesRes, statsRes] = await Promise.all([
        fetch("/api/invites"),
        fetch("/api/users"),
        fetch("/api/companies"),
        fetch("/api/invites/stats"),
      ]);

      if (invitesRes.ok) setInvites(await invitesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      console.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar convite");
        return;
      }

      setInvites((prev) => [data, ...prev]);
      setShowInviteModal(false);
      setInviteForm({ email: "", type: "COMPANY_ADMIN", companyId: "" });
      fetchData();
    } catch {
      setError("Erro ao criar convite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/invites/${id}/resend`, { method: "POST" });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Erro ao reenviar convite");
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/invites/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch {
      console.error("Erro ao cancelar convite");
    }
  };

  const companiesWithoutAccess = companies.filter(
    (c) => !c.users || c.users.length === 0
  );

  const filteredInvites = invites.filter(
    (i) =>
      i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.company?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInviteTypeLabel = (type: InviteType) => {
    switch (type) {
      case "COMPANY_ADMIN":
        return "Cliente";
      case "MEMBER_ADMIN":
        return "Admin";
      case "MEMBER_CS":
        return "CS Owner";
    }
  };

  const getInviteTypeIcon = (type: InviteType) => {
    switch (type) {
      case "COMPANY_ADMIN":
        return Building2;
      case "MEMBER_ADMIN":
        return Shield;
      case "MEMBER_CS":
        return Headphones;
    }
  };

  const getStatusBadge = (status: InviteStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pendente</Badge>;
      case "ACCEPTED":
        return <Badge variant="success">Aceito</Badge>;
      case "EXPIRED":
        return <Badge variant="secondary">Expirado</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelado</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-purple-100 text-purple-700">Admin</Badge>;
      case "CS_OWNER":
        return <Badge className="bg-blue-100 text-blue-700">CS Owner</Badge>;
      case "CLIENT":
        return <Badge className="bg-emerald-100 text-emerald-700">Cliente</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Gestão de Acessos" showFilters={false} />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Convites Pendentes"
            value={stats?.pending || 0}
            icon={Clock}
            gradient="from-amber-500 to-orange-500"
          />
          <StatsCard
            label="Convites Aceitos"
            value={stats?.accepted || 0}
            icon={CheckCircle2}
            gradient="from-emerald-500 to-teal-500"
          />
          <StatsCard
            label="Usuários Ativos"
            value={users.length}
            icon={Users}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatsCard
            label="Empresas sem Acesso"
            value={companiesWithoutAccess.length}
            icon={AlertCircle}
            gradient="from-rose-500 to-pink-500"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="gap-2" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4" />
            Novo Convite
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invites">
              Convites
              {stats?.pending ? (
                <Badge variant="warning" size="sm" className="ml-2">
                  {stats.pending}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="users">
              Usuários
              <Badge variant="secondary" size="sm" className="ml-2">
                {users.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="companies">
              Empresas sem Acesso
              {companiesWithoutAccess.length > 0 && (
                <Badge variant="danger" size="sm" className="ml-2">
                  {companiesWithoutAccess.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="invites" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Convites Enviados</CardTitle>
                    <CardDescription>
                      Gerencie os convites de acesso à plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </div>
                    ) : filteredInvites.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum convite encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredInvites.map((invite) => {
                          const TypeIcon = getInviteTypeIcon(invite.type);
                          return (
                            <motion.div
                              key={invite.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-sm transition-all"
                            >
                              <div
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-lg",
                                  invite.type === "COMPANY_ADMIN" &&
                                    "bg-emerald-100 text-emerald-600",
                                  invite.type === "MEMBER_ADMIN" &&
                                    "bg-purple-100 text-purple-600",
                                  invite.type === "MEMBER_CS" &&
                                    "bg-blue-100 text-blue-600"
                                )}
                              >
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{invite.email}</p>
                                  <Badge variant="outline" size="sm">
                                    {getInviteTypeLabel(invite.type)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {invite.company && (
                                    <>
                                      <Building2 className="h-3 w-3" />
                                      <span>{invite.company.name}</span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span>
                                    Enviado {formatRelativeTime(invite.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(invite.status)}
                                {invite.status === "PENDING" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleResendInvite(invite.id)}
                                      title="Reenviar"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleCancelInvite(invite.id)}
                                      title="Cancelar"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Usuários Cadastrados</CardTitle>
                    <CardDescription>
                      Lista de todos os usuários com acesso à plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum usuário encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUsers.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-sm transition-all"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name}</p>
                                {getRoleBadge(user.role)}
                                {user.emailVerified && (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                                {user.company && (
                                  <>
                                    <span>•</span>
                                    <Building2 className="h-3 w-3" />
                                    <span>{user.company.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatRelativeTime(user.createdAt)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="companies" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Empresas sem Acesso</CardTitle>
                    <CardDescription>
                      Empresas cadastradas que ainda não possuem usuários vinculados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </div>
                    ) : companiesWithoutAccess.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-success" />
                        <p>Todas as empresas possuem usuários vinculados</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {companiesWithoutAccess.map((company) => (
                          <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-sm transition-all"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{company.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {company.cnpj && <span>{company.cnpj}</span>}
                                {company.segment && (
                                  <>
                                    {company.cnpj && <span>•</span>}
                                    <span>{company.segment}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                setInviteForm({
                                  email: "",
                                  type: "COMPANY_ADMIN",
                                  companyId: company.id,
                                });
                                setShowInviteModal(true);
                              }}
                            >
                              <Send className="h-4 w-4" />
                              Convidar
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Novo Convite</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInviteModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tipo de Acesso
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <InviteTypeButton
                      type="COMPANY_ADMIN"
                      label="Cliente"
                      icon={Building2}
                      selected={inviteForm.type === "COMPANY_ADMIN"}
                      onClick={() =>
                        setInviteForm((prev) => ({ ...prev, type: "COMPANY_ADMIN" }))
                      }
                    />
                    <InviteTypeButton
                      type="MEMBER_ADMIN"
                      label="Admin"
                      icon={Shield}
                      selected={inviteForm.type === "MEMBER_ADMIN"}
                      onClick={() =>
                        setInviteForm((prev) => ({
                          ...prev,
                          type: "MEMBER_ADMIN",
                          companyId: "",
                        }))
                      }
                    />
                    <InviteTypeButton
                      type="MEMBER_CS"
                      label="CS Owner"
                      icon={Headphones}
                      selected={inviteForm.type === "MEMBER_CS"}
                      onClick={() =>
                        setInviteForm((prev) => ({
                          ...prev,
                          type: "MEMBER_CS",
                          companyId: "",
                        }))
                      }
                    />
                  </div>
                </div>
                {inviteForm.type === "COMPANY_ADMIN" && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Empresa
                    </label>
                    <select
                      value={inviteForm.companyId}
                      onChange={(e) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          companyId: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancelar
                </Button>
                <Button
                  className="gap-2"
                  onClick={handleCreateInvite}
                  disabled={
                    submitting ||
                    !inviteForm.email ||
                    (inviteForm.type === "COMPANY_ADMIN" && !inviteForm.companyId)
                  }
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Enviando..." : "Enviar Convite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
              gradient
            )}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function InviteTypeButton({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  type: InviteType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-transparent bg-muted hover:bg-muted/80"
      )}
    >
      <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
