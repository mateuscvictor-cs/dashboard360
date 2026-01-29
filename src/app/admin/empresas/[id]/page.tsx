"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Package,
  User,
  DollarSign,
  Tag,
  Users,
  Building2,
  FileText,
  Upload,
  Link as LinkIcon,
  GraduationCap,
  Users2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateNextDate, formatDateShort } from "@/lib/utils";
import { LogoUpload, ResourceManager } from "@/components/company";

type CadenceType = "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "";

interface Delivery {
  title: string;
  description: string;
  dueDate: string;
  assignee: string;
  impact: "high" | "medium" | "low";
  cadence: CadenceType;
}

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  isDecisionMaker: boolean;
}

interface Workshop {
  title: string;
  description: string;
  scheduledDate: string;
  duration: string;
  participants: string;
  cadence: CadenceType;
}

interface Hotseat {
  title: string;
  description: string;
  scheduledDate: string;
  duration: string;
  participants: string;
  cadence: CadenceType;
}

const segments = ["Enterprise", "Mid-Market", "SMB", "Startup"];
const frameworks = ["ICIA", "COPA", "ICIA Outsourcing", "CNH da IA", "Outro"];
const squads = ["Squad Alpha", "Squad Beta", "Squad Gamma"];
const csOwners = ["Carlos Silva", "Ana Rodrigues", "Pedro Santos"];
const impacts = [
  { value: "high", label: "Alto" },
  { value: "medium", label: "Médio" },
  { value: "low", label: "Baixo" },
];

const cadences = [
  { value: "", label: "Sem cadência" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
  { value: "custom", label: "Personalizada" },
];

interface CompanyData {
  id: string;
  name: string;
  logo: string | null;
  segment: string | null;
  plan: string | null;
  framework: string | null;
  billedAmount: number;
  cashIn: number;
  mrr: number;
  tags: string[];
  fathomLink: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  csOwner: { id: string; name: string } | null;
  squad: { id: string; name: string } | null;
  contacts: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string;
    phone: string | null;
    isDecisionMaker: boolean;
  }>;
  deliveries: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    assignee: string | null;
    impact: string;
    cadence: string | null;
  }>;
  workshops: Array<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    duration: number | null;
    participants: number;
    cadence: string | null;
  }>;
  hotseats: Array<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    duration: number | null;
    participants: number;
    cadence: string | null;
  }>;
}

export default function EditarEmpresaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    segment: "",
    framework: "",
    frameworkOther: "",
    billedAmount: "",
    cashIn: "",
    mrr: "",
    tags: [] as string[],
    csOwner: "",
    squad: "",
    startDate: "",
    expectedCompletion: "",
    status: "active",
    contractFile: null as File | null,
    proposalFile: null as File | null,
    fathomLink: "",
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [hotseats, setHotseats] = useState<Hotseat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${id}`);
      if (response.ok) {
        const data: CompanyData = await response.json();
        setCompany(data);
        
        setFormData({
          name: data.name,
          segment: data.segment || "",
          framework: data.framework || data.plan || "",
          frameworkOther: "",
          billedAmount: data.billedAmount?.toString() || "",
          cashIn: data.cashIn?.toString() || "",
          mrr: data.mrr.toString(),
          tags: data.tags || [],
          csOwner: data.csOwner?.name || "",
          squad: data.squad?.name || "",
          startDate: data.contractStart?.split("T")[0] || "",
          expectedCompletion: data.contractEnd?.split("T")[0] || "",
          status: "active",
          contractFile: null,
          proposalFile: null,
          fathomLink: data.fathomLink || "",
        });

        setDeliveries(
          data.deliveries.map((d) => ({
            title: d.title,
            description: "",
            dueDate: d.dueDate?.split("T")[0] || "",
            assignee: d.assignee || "",
            impact: (d.impact?.toLowerCase() || "medium") as "high" | "medium" | "low",
            cadence: (d.cadence?.toLowerCase() || "") as CadenceType,
          }))
        );

        setWorkshops(
          data.workshops.map((w) => ({
            title: w.title,
            description: w.description || "",
            scheduledDate: w.date?.split("T")[0] || "",
            duration: w.duration?.toString() || "",
            participants: w.participants?.toString() || "",
            cadence: (w.cadence?.toLowerCase() || "") as CadenceType,
          }))
        );

        setHotseats(
          data.hotseats.map((h) => ({
            title: h.title,
            description: h.description || "",
            scheduledDate: h.date?.split("T")[0] || "",
            duration: h.duration?.toString() || "",
            participants: h.participants?.toString() || "",
            cadence: (h.cadence?.toLowerCase() || "") as CadenceType,
          }))
        );

        setContacts(
          data.contacts.map((c) => ({
            name: c.name,
            role: c.role || "",
            email: c.email,
            phone: c.phone || "",
            isDecisionMaker: c.isDecisionMaker,
          }))
        );
      } else if (response.status === 404) {
        setError("Empresa não encontrada");
      } else {
        setError("Erro ao carregar dados");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro de conexão");
    } finally {
      setInitialLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Carregando..." subtitle="" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Empresa" subtitle="" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <p className="text-center text-muted-foreground mb-4">{error}</p>
              <Link href="/admin/empresas">
                <Button variant="outline">Voltar para Empresas</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const addDelivery = () => {
    setDeliveries([
      ...deliveries,
      {
        title: "",
        description: "",
        dueDate: "",
        assignee: "",
        impact: "medium",
        cadence: "",
      },
    ]);
  };

  const removeDelivery = (index: number) => {
    setDeliveries(deliveries.filter((_, i) => i !== index));
  };

  const updateDelivery = (index: number, field: keyof Delivery, value: string) => {
    const updated = [...deliveries];
    updated[index] = { ...updated[index], [field]: value };
    setDeliveries(updated);
  };

  const addWorkshop = () => {
    setWorkshops([
      ...workshops,
      {
        title: "",
        description: "",
        scheduledDate: "",
        duration: "",
        participants: "",
        cadence: "",
      },
    ]);
  };

  const removeWorkshop = (index: number) => {
    setWorkshops(workshops.filter((_, i) => i !== index));
  };

  const updateWorkshop = (index: number, field: keyof Workshop, value: string) => {
    const updated = [...workshops];
    updated[index] = { ...updated[index], [field]: value };
    setWorkshops(updated);
  };

  const addHotseat = () => {
    setHotseats([
      ...hotseats,
      {
        title: "",
        description: "",
        scheduledDate: "",
        duration: "",
        participants: "",
        cadence: "",
      },
    ]);
  };

  const removeHotseat = (index: number) => {
    setHotseats(hotseats.filter((_, i) => i !== index));
  };

  const updateHotseat = (index: number, field: keyof Hotseat, value: string) => {
    const updated = [...hotseats];
    updated[index] = { ...updated[index], [field]: value };
    setHotseats(updated);
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        name: "",
        role: "",
        email: "",
        phone: "",
        isDecisionMaker: false,
      },
    ]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert("Preencha o nome da empresa");
      return;
    }

    setLoading(true);

    try {
      const companyResponse = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          segment: formData.segment,
          framework: formData.framework === "Outro" ? formData.frameworkOther : formData.framework,
          billedAmount: formData.billedAmount,
          cashIn: formData.cashIn,
          mrr: formData.mrr,
          tags: formData.tags,
          fathomLink: formData.fathomLink,
        }),
      });

      if (!companyResponse.ok) {
        throw new Error("Erro ao atualizar empresa");
      }

      for (const delivery of deliveries) {
        if (delivery.title) {
          await fetch(`/api/companies/${id}/deliveries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: delivery.title,
              description: delivery.description,
              dueDate: delivery.dueDate || null,
              assignee: delivery.assignee || null,
              impact: delivery.impact.toUpperCase(),
              cadence: delivery.cadence ? delivery.cadence.toUpperCase() : null,
            }),
          });
        }
      }

      for (const workshop of workshops) {
        if (workshop.title && workshop.scheduledDate) {
          await fetch(`/api/companies/${id}/workshops`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: workshop.title,
              description: workshop.description,
              date: workshop.scheduledDate,
              duration: workshop.duration,
              participants: parseInt(workshop.participants) || 0,
              cadence: workshop.cadence ? workshop.cadence.toUpperCase() : null,
            }),
          });
        }
      }

      for (const hotseat of hotseats) {
        if (hotseat.title && hotseat.scheduledDate) {
          await fetch(`/api/companies/${id}/hotseats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: hotseat.title,
              description: hotseat.description,
              date: hotseat.scheduledDate,
              duration: hotseat.duration,
              participants: parseInt(hotseat.participants) || 0,
              cadence: hotseat.cadence ? hotseat.cadence.toUpperCase() : null,
            }),
          });
        }
      }

      router.push(`/admin/conta/${id}`);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title={`Editar: ${company.name}`} subtitle="Atualize as informações da empresa" showFilters={false} />

      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-7xl space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/empresas">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold">Dados da Empresa</h2>
              <p className="text-sm text-muted-foreground">
                Atualize as informações e configurações
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>Dados Básicos</CardTitle>
                  </div>
                  <CardDescription>Informações principais da empresa</CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nome da Empresa <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Segmento</label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {segments.map((seg) => (
                      <option key={seg} value={seg}>
                        {seg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Framework</label>
                  <select
                    value={formData.framework}
                    onChange={(e) => setFormData({ ...formData, framework: e.target.value, frameworkOther: e.target.value === "Outro" ? formData.frameworkOther : "" })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {frameworks.map((fw) => (
                      <option key={fw} value={fw}>
                        {fw}
                      </option>
                    ))}
                  </select>
                  {formData.framework === "Outro" && (
                    <input
                      type="text"
                      value={formData.frameworkOther}
                      onChange={(e) => setFormData({ ...formData, frameworkOther: e.target.value })}
                      className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mt-2"
                      placeholder="Especifique o framework"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Faturado (Valor Total)
                  </label>
                  <input
                    type="number"
                    value={formData.billedAmount}
                    onChange={(e) => setFormData({ ...formData, billedAmount: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Cash In (Entrada)
                  </label>
                  <input
                    type="number"
                    value={formData.cashIn}
                    onChange={(e) => setFormData({ ...formData, cashIn: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    MRR
                  </label>
                  <input
                    type="number"
                    value={formData.mrr}
                    onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.billedAmount && parseFloat(formData.billedAmount) > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cash In / Faturado</span>
                    <span className="text-sm font-semibold text-primary">
                      {((parseFloat(formData.cashIn || "0") / parseFloat(formData.billedAmount)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((parseFloat(formData.cashIn || "0") / parseFloat(formData.billedAmount)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Digite e pressione Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-danger"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>Atribuição</CardTitle>
                  </div>
                  <CardDescription>Defina responsáveis pelo projeto</CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  CS Owner <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={formData.csOwner}
                  onChange={(e) => setFormData({ ...formData, csOwner: e.target.value })}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {csOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Squad Responsável</label>
                <select
                  value={formData.squad}
                  onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {squads.map((squad) => (
                    <option key={squad} value={squad}>
                      {squad}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle>Entregas</CardTitle>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addDelivery} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Entrega
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveries.map((delivery, index) => (
                <div
                  key={index}
                  className="rounded-xl border p-4 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Entrega #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeDelivery(index)}
                      className="h-7 w-7 text-muted-foreground hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Título</label>
                    <input
                      type="text"
                      value={delivery.title}
                      onChange={(e) => updateDelivery(index, "title", e.target.value)}
                      className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1 block">Descrição</label>
                    <textarea
                      value={delivery.description}
                      onChange={(e) => updateDelivery(index, "description", e.target.value)}
                      className="w-full min-h-[60px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Prazo</label>
                      <input
                        type="date"
                        value={delivery.dueDate}
                        onChange={(e) => updateDelivery(index, "dueDate", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">Responsável</label>
                      <select
                        value={delivery.assignee}
                        onChange={(e) => updateDelivery(index, "assignee", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Selecione...</option>
                        {squads.map((squad) => (
                          <option key={squad} value={squad}>
                            {squad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">Impacto</label>
                      <select
                        value={delivery.impact}
                        onChange={(e) => updateDelivery(index, "impact", e.target.value as "high" | "medium" | "low")}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {impacts.map((imp) => (
                          <option key={imp.value} value={imp.value}>
                            {imp.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">Cadência</label>
                      <select
                        value={delivery.cadence}
                        onChange={(e) => updateDelivery(index, "cadence", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {cadences.map((cad) => (
                          <option key={cad.value} value={cad.value}>
                            {cad.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {delivery.dueDate && delivery.cadence && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Próxima entrega prevista:</span>{" "}
                        {formatDateShort(calculateNextDate(delivery.dueDate, delivery.cadence.toUpperCase()) || new Date())}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <CardTitle>Workshops</CardTitle>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addWorkshop} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Workshop
                    </Button>
                  </div>
                  <CardDescription>Configure os workshops do projeto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workshops.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhum workshop adicionado</p>
                      <p className="text-xs mt-1">Clique em "Adicionar Workshop" para começar</p>
                    </div>
                  ) : (
                    workshops.map((workshop, index) => (
                      <div
                        key={index}
                        className="rounded-xl border p-4 space-y-3 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Workshop #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeWorkshop(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-danger"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block">Título</label>
                          <input
                            type="text"
                            value={workshop.title}
                            onChange={(e) => updateWorkshop(index, "title", e.target.value)}
                            className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Ex: Workshop de Integração"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block">Descrição</label>
                          <textarea
                            value={workshop.description}
                            onChange={(e) => updateWorkshop(index, "description", e.target.value)}
                            className="w-full min-h-[60px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            placeholder="Descreva o workshop..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Data Agendada</label>
                            <input
                              type="date"
                              value={workshop.scheduledDate}
                              onChange={(e) => updateWorkshop(index, "scheduledDate", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block">Duração</label>
                            <input
                              type="text"
                              value={workshop.duration}
                              onChange={(e) => updateWorkshop(index, "duration", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              placeholder="Ex: 4 horas"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block">Participantes</label>
                            <input
                              type="text"
                              value={workshop.participants}
                              onChange={(e) => updateWorkshop(index, "participants", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              placeholder="Ex: 10 pessoas"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block">Cadência</label>
                            <select
                              value={workshop.cadence}
                              onChange={(e) => updateWorkshop(index, "cadence", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                              {cadences.map((cad) => (
                                <option key={cad.value} value={cad.value}>
                                  {cad.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {workshop.scheduledDate && workshop.cadence && (
                          <div className="mt-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Próximo workshop previsto:</span>{" "}
                              {formatDateShort(calculateNextDate(workshop.scheduledDate, workshop.cadence.toUpperCase()) || new Date())}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users2 className="h-5 w-5 text-primary" />
                      <CardTitle>Hotseats</CardTitle>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addHotseat} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Hotseat
                    </Button>
                  </div>
                  <CardDescription>Configure os hotseats do projeto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hotseats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nenhum hotseat adicionado</p>
                      <p className="text-xs mt-1">Clique em "Adicionar Hotseat" para começar</p>
                    </div>
                  ) : (
                    hotseats.map((hotseat, index) => (
                      <div
                        key={index}
                        className="rounded-xl border p-4 space-y-3 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Hotseat #{index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeHotseat(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-danger"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block">Título</label>
                          <input
                            type="text"
                            value={hotseat.title}
                            onChange={(e) => updateHotseat(index, "title", e.target.value)}
                            className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Ex: Hotseat de Análise"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block">Descrição</label>
                          <textarea
                            value={hotseat.description}
                            onChange={(e) => updateHotseat(index, "description", e.target.value)}
                            className="w-full min-h-[60px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            placeholder="Descreva o hotseat..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Data Agendada</label>
                            <input
                              type="date"
                              value={hotseat.scheduledDate}
                              onChange={(e) => updateHotseat(index, "scheduledDate", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block">Duração</label>
                            <input
                              type="text"
                              value={hotseat.duration}
                              onChange={(e) => updateHotseat(index, "duration", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              placeholder="Ex: 2 horas"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block">Participantes</label>
                            <input
                              type="text"
                              value={hotseat.participants}
                              onChange={(e) => updateHotseat(index, "participants", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              placeholder="Ex: 5 pessoas"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium mb-1 block">Cadência</label>
                            <select
                              value={hotseat.cadence}
                              onChange={(e) => updateHotseat(index, "cadence", e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                              {cadences.map((cad) => (
                                <option key={cad.value} value={cad.value}>
                                  {cad.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {hotseat.scheduledDate && hotseat.cadence && (
                          <div className="mt-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Próximo hotseat previsto:</span>{" "}
                              {formatDateShort(calculateNextDate(hotseat.scheduledDate, hotseat.cadence.toUpperCase()) || new Date())}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle>Contatos</CardTitle>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Contato
                    </Button>
                  </div>
                  <CardDescription>
                    Adicione os contatos principais da empresa <span className="text-danger">*</span>
                  </CardDescription>
                </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="rounded-xl border p-4 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Contato #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeContact(index)}
                      className="h-7 w-7 text-muted-foreground hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Nome</label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => updateContact(index, "name", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">Cargo</label>
                      <input
                        type="text"
                        value={contact.role}
                        onChange={(e) => updateContact(index, "role", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Email</label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(index, "email", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">Telefone</label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, "phone", e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`decision-maker-${index}`}
                      checked={contact.isDecisionMaker}
                      onChange={(e) => updateContact(index, "isDecisionMaker", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`decision-maker-${index}`} className="text-sm text-muted-foreground">
                      É decisor
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>Logo</CardTitle>
                  </div>
                  <CardDescription>Logo visível no painel do cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <LogoUpload companyId={id} currentLogo={company?.logo || null} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Documentos</CardTitle>
                  </div>
                  <CardDescription>Anexe documentos importantes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Contrato
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setFormData({ ...formData, contractFile: e.target.files?.[0] || null })}
                        className="hidden"
                        id="contract-upload-edit"
                      />
                      <label
                        htmlFor="contract-upload-edit"
                        className="flex-1 h-10 rounded-lg border border-dashed bg-muted/50 flex items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formData.contractFile ? formData.contractFile.name : "Anexar contrato"}
                        </span>
                      </label>
                      {formData.contractFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormData({ ...formData, contractFile: null })}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Proposta Comercial
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setFormData({ ...formData, proposalFile: e.target.files?.[0] || null })}
                        className="hidden"
                        id="proposal-upload-edit"
                      />
                      <label
                        htmlFor="proposal-upload-edit"
                        className="flex-1 h-10 rounded-lg border border-dashed bg-muted/50 flex items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formData.proposalFile ? formData.proposalFile.name : "Anexar proposta"}
                        </span>
                      </label>
                      {formData.proposalFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormData({ ...formData, proposalFile: null })}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      Reunião Fathom
                    </label>
                    <input
                      type="url"
                      value={formData.fathomLink}
                      onChange={(e) => setFormData({ ...formData, fathomLink: e.target.value })}
                      className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="https://fathom.video/..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <ResourceManager companyId={id} />

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Link href="/admin/empresas">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="gap-2 bg-gradient-brand hover:brightness-110">
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
