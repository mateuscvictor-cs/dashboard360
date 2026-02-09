"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Calendar,
  TrendingUp,
  Clock,
  ExternalLink,
  Settings,
  ClipboardList,
  FolderOpen,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateNextDate, formatDateShort } from "@/lib/utils";
import { LogoUpload, ResourceManager, DiagnosticManager, CompanyComments } from "@/components/company";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TranscriptionManager } from "./transcription-manager";

type CadenceType = "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "";

interface Delivery {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  assignee: string;
  impact: "high" | "medium" | "low";
  cadence: CadenceType;
}

interface Contact {
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isDecisionMaker: boolean;
}

interface Workshop {
  id?: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: string;
  participants: string;
  cadence: CadenceType;
}

interface Hotseat {
  id?: string;
  title: string;
  description: string;
  scheduledDate: string;
  duration: string;
  participants: string;
  cadence: CadenceType;
}

const segments = ["Enterprise", "Mid-Market", "SMB", "Startup"];
const frameworks = ["ICIA", "COPA", "ICIA Outsourcing", "CNH da IA", "Outro"];
const impacts = [
  { value: "high", label: "Alto" },
  { value: "medium", label: "Médio" },
  { value: "low", label: "Baixo" },
];

const CADENCE_NONE = "__none__";
const cadences = [
  { value: CADENCE_NONE, label: "Sem cadência" },
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
  healthScore: number;
  healthStatus: string;
  csOwner: { id: string; name: string; user?: { email: string } } | null;
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
  _count?: {
    users: number;
    deliveries: number;
  };
}

interface CsOwnerOption {
  id: string;
  name: string;
  user: { id: string; email: string };
}

interface SquadOption {
  id: string;
  name: string;
}

export default function EditarEmpresaPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tabParam = searchParams.get("tab") || "dados";
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [csOwners, setCsOwners] = useState<CsOwnerOption[]>([]);
  const [squads, setSquads] = useState<SquadOption[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    segment: "",
    framework: "",
    frameworkOther: "",
    billedAmount: "",
    cashIn: "",
    mrr: "",
    tags: [] as string[],
    csOwnerId: "",
    squadId: "",
    startDate: "",
    expectedCompletion: "",
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
    fetchData();
  }, [id]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.startsWith("#comment-") && tabParam !== "comentarios") {
      router.replace(`/admin/empresas/${id}?tab=comentarios${hash}`, { scroll: false });
    }
  }, [id, tabParam, router]);

  useEffect(() => {
    if (tabParam !== "comentarios") return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash) {
      const idFromHash = hash.slice(1);
      const el = document.getElementById(idFromHash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
      }
    }
  }, [tabParam]);

  const fetchData = async () => {
    try {
      const [companyRes, csOwnersRes, squadsRes] = await Promise.all([
        fetch(`/api/companies/${id}`),
        fetch("/api/cs-owners"),
        fetch("/api/squads"),
      ]);

      if (companyRes.ok) {
        const data: CompanyData = await companyRes.json();
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
          csOwnerId: data.csOwner?.id || "",
          squadId: data.squad?.id || "",
          startDate: data.contractStart?.split("T")[0] || "",
          expectedCompletion: data.contractEnd?.split("T")[0] || "",
          contractFile: null,
          proposalFile: null,
          fathomLink: data.fathomLink || "",
        });

        setDeliveries(
          data.deliveries.map((d) => ({
            id: d.id,
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
            id: w.id,
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
            id: h.id,
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
            id: c.id,
            name: c.name,
            role: c.role || "",
            email: c.email,
            phone: c.phone || "",
            isDecisionMaker: c.isDecisionMaker,
          }))
        );
      } else if (companyRes.status === 404) {
        setError("Empresa não encontrada");
      }

      if (csOwnersRes.ok) {
        setCsOwners(await csOwnersRes.json());
      }

      if (squadsRes.ok) {
        setSquads(await squadsRes.json());
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro de conexão");
    } finally {
      setInitialLoading(false);
    }
  };

  const addDelivery = () => setDeliveries([...deliveries, { title: "", description: "", dueDate: "", assignee: "", impact: "medium", cadence: "" }]);
  const removeDelivery = (index: number) => setDeliveries(deliveries.filter((_, i) => i !== index));
  const updateDelivery = (index: number, field: keyof Delivery, value: string) => {
    const updated = [...deliveries];
    updated[index] = { ...updated[index], [field]: value };
    setDeliveries(updated);
  };

  const addWorkshop = () => setWorkshops([...workshops, { title: "", description: "", scheduledDate: "", duration: "", participants: "", cadence: "" }]);
  const removeWorkshop = (index: number) => setWorkshops(workshops.filter((_, i) => i !== index));
  const updateWorkshop = (index: number, field: keyof Workshop, value: string) => {
    const updated = [...workshops];
    updated[index] = { ...updated[index], [field]: value };
    setWorkshops(updated);
  };

  const addHotseat = () => setHotseats([...hotseats, { title: "", description: "", scheduledDate: "", duration: "", participants: "", cadence: "" }]);
  const removeHotseat = (index: number) => setHotseats(hotseats.filter((_, i) => i !== index));
  const updateHotseat = (index: number, field: keyof Hotseat, value: string) => {
    const updated = [...hotseats];
    updated[index] = { ...updated[index], [field]: value };
    setHotseats(updated);
  };

  const addContact = () => setContacts([...contacts, { name: "", role: "", email: "", phone: "", isDecisionMaker: false }]);
  const removeContact = (index: number) => setContacts(contacts.filter((_, i) => i !== index));
  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Preencha o nome da empresa");
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
          csOwnerId: formData.csOwnerId || undefined,
          squadId: formData.squadId || undefined,
        }),
      });

      if (!companyResponse.ok) throw new Error("Erro ao atualizar empresa");

      const existingDeliveryIds = new Set((company?.deliveries ?? []).map((d) => d.id));
      const currentDeliveryIds = new Set(deliveries.filter((d) => d.id).map((d) => d.id!));
      const toDeleteDeliveryIds = [...existingDeliveryIds].filter((id) => !currentDeliveryIds.has(id));
      for (const deliveryId of toDeleteDeliveryIds) {
        const res = await fetch(`/api/deliveries/${deliveryId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao remover entrega");
      }
      for (const d of deliveries) {
        const impact = (d.impact?.toUpperCase() || "MEDIUM") as string;
        const cadence = d.cadence ? (d.cadence.toUpperCase() as string) : null;
        if (d.id && existingDeliveryIds.has(d.id)) {
          const res = await fetch(`/api/deliveries/${d.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: d.title,
              dueDate: d.dueDate || null,
              assignee: d.assignee || null,
              impact,
              cadence,
            }),
          });
          if (!res.ok) throw new Error("Erro ao atualizar entrega");
        } else if (!d.id && d.title.trim()) {
          const res = await fetch(`/api/companies/${id}/deliveries`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: d.title.trim(),
              status: "PENDING",
              dueDate: d.dueDate || null,
              assignee: d.assignee || null,
              impact,
              cadence,
            }),
          });
          if (!res.ok) throw new Error("Erro ao criar entrega");
        }
      }

      const contactsRes = await fetch(`/api/companies/${id}/contacts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contacts.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role || undefined,
            email: c.email,
            phone: c.phone || undefined,
            isDecisionMaker: c.isDecisionMaker,
          })),
        }),
      });
      if (!contactsRes.ok) throw new Error("Erro ao salvar contatos");

      const existingWorkshopIds = new Set((company?.workshops ?? []).map((w) => w.id));
      const currentWorkshopIds = new Set(workshops.filter((w) => w.id).map((w) => w.id!));
      const toDeleteWorkshopIds = [...existingWorkshopIds].filter((wid) => !currentWorkshopIds.has(wid));
      for (const workshopId of toDeleteWorkshopIds) {
        const res = await fetch(`/api/companies/${id}/workshops/${workshopId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao remover workshop");
      }
      for (const w of workshops) {
        const cadence = w.cadence ? (w.cadence.toUpperCase() as string) : null;
        if (w.id && existingWorkshopIds.has(w.id)) {
          const res = await fetch(`/api/companies/${id}/workshops/${w.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: w.title,
              description: w.description || null,
              date: w.scheduledDate || new Date().toISOString().split("T")[0],
              duration: w.duration ? parseInt(w.duration, 10) : null,
              participants: w.participants ? parseInt(w.participants, 10) : 0,
              cadence,
            }),
          });
          if (!res.ok) throw new Error("Erro ao atualizar workshop");
        } else if (!w.id && w.title.trim() && w.scheduledDate) {
          const res = await fetch(`/api/companies/${id}/workshops`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: w.title.trim(),
              description: w.description || null,
              date: w.scheduledDate,
              duration: w.duration ? parseInt(w.duration, 10) : null,
              participants: w.participants ? parseInt(w.participants, 10) : 0,
              cadence,
            }),
          });
          if (!res.ok) throw new Error("Erro ao criar workshop");
        }
      }

      const existingHotseatIds = new Set((company?.hotseats ?? []).map((h) => h.id));
      const currentHotseatIds = new Set(hotseats.filter((h) => h.id).map((h) => h.id!));
      const toDeleteHotseatIds = [...existingHotseatIds].filter((hid) => !currentHotseatIds.has(hid));
      for (const hotseatId of toDeleteHotseatIds) {
        const res = await fetch(`/api/companies/${id}/hotseats/${hotseatId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao remover hotseat");
      }
      for (const h of hotseats) {
        const cadence = h.cadence ? (h.cadence.toUpperCase() as string) : null;
        if (h.id && existingHotseatIds.has(h.id)) {
          const res = await fetch(`/api/companies/${id}/hotseats/${h.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: h.title,
              description: h.description || null,
              date: h.scheduledDate || new Date().toISOString().split("T")[0],
              duration: h.duration ? parseInt(h.duration, 10) : null,
              participants: h.participants ? parseInt(h.participants, 10) : 0,
              cadence,
            }),
          });
          if (!res.ok) throw new Error("Erro ao atualizar hotseat");
        } else if (!h.id && h.title.trim() && h.scheduledDate) {
          const res = await fetch(`/api/companies/${id}/hotseats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: h.title.trim(),
              description: h.description || null,
              date: h.scheduledDate,
              duration: h.duration ? parseInt(h.duration, 10) : null,
              participants: h.participants ? parseInt(h.participants, 10) : 0,
              cadence,
            }),
          });
          if (!res.ok) throw new Error("Erro ao criar hotseat");
        }
      }

      router.push("/admin/empresas");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "HEALTHY": return "text-green-500 bg-green-500/10";
      case "AT_RISK": return "text-yellow-500 bg-yellow-500/10";
      case "CRITICAL": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
    );
  }

  const cashInPercentage = formData.billedAmount && parseFloat(formData.billedAmount) > 0
    ? (parseFloat(formData.cashIn || "0") / parseFloat(formData.billedAmount)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/empresas">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  {company.logo ? (
                    <AvatarImage src={company.logo} alt={company.name} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {company.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{company.name}</h1>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href="/admin/tutoriais/empresas">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                              aria-label="Aprenda a editar suas empresas"
                            >
                              <HelpCircle className="h-5 w-5" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          Aprenda a editar suas empresas
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {company.segment && <Badge variant="outline">{company.segment}</Badge>}
                    {company.framework && <Badge variant="secondary">{company.framework}</Badge>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getHealthColor(company.healthStatus)}`}>
                      Health: {company.healthScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/admin/empresas")}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(company.billedAmount)}</p>
                  <p className="text-xs text-muted-foreground">Valor Faturado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(company.cashIn)}</p>
                  <p className="text-xs text-muted-foreground">Cash In ({cashInPercentage.toFixed(0)}%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(company.mrr)}</p>
                  <p className="text-xs text-muted-foreground">MRR</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{company.deliveries.length}</p>
                  <p className="text-xs text-muted-foreground">Entregas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={tabParam}
          onValueChange={(v) => router.replace(`/admin/empresas/${id}?tab=${v}`, { scroll: false })}
          className="space-y-6"
        >
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dados" className="gap-2">
              <Building2 className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="entregas" className="gap-2">
              <Package className="h-4 w-4" />
              Entregas ({deliveries.length})
            </TabsTrigger>
            <TabsTrigger value="eventos" className="gap-2">
              <Calendar className="h-4 w-4" />
              Eventos ({workshops.length + hotseats.length})
            </TabsTrigger>
            <TabsTrigger value="contatos" className="gap-2">
              <Users className="h-4 w-4" />
              Contatos ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="recursos" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="diagnostico" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="transcricoes" className="gap-2">
              <FileText className="h-4 w-4" />
              Transcrições
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Nome da Empresa *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Segmento</label>
                        <Select value={formData.segment} onValueChange={(v) => setFormData({ ...formData, segment: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {segments.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Framework</label>
                        <Select value={formData.framework} onValueChange={(v) => setFormData({ ...formData, framework: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {frameworks.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Valor Faturado</label>
                        <Input
                          type="number"
                          value={formData.billedAmount}
                          onChange={(e) => setFormData({ ...formData, billedAmount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Cash In</label>
                        <Input
                          type="number"
                          value={formData.cashIn}
                          onChange={(e) => setFormData({ ...formData, cashIn: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">MRR</label>
                        <Input
                          type="number"
                          value={formData.mrr}
                          onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {cashInPercentage > 0 && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso Cash In</span>
                          <span className="font-medium">{cashInPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(cashInPercentage, 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Atribuição
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">CS Owner</label>
                        <Select value={formData.csOwnerId} onValueChange={(v) => setFormData({ ...formData, csOwnerId: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {csOwners.map((cs) => <SelectItem key={cs.id} value={cs.id}>{cs.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Squad</label>
                        <Select value={formData.squadId} onValueChange={(v) => setFormData({ ...formData, squadId: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {squads.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        placeholder="Adicionar tag..."
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Logo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LogoUpload companyId={id} currentLogo={company?.logo || null} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-primary" />
                      Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Link Fathom</label>
                      <Input
                        value={formData.fathomLink}
                        onChange={(e) => setFormData({ ...formData, fathomLink: e.target.value })}
                        placeholder="https://fathom.video/..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="entregas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Entregas
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={addDelivery} className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma entrega cadastrada</p>
                  </div>
                ) : deliveries.map((delivery, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Entrega #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeDelivery(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={delivery.title}
                      onChange={(e) => updateDelivery(index, "title", e.target.value)}
                      placeholder="Título da entrega"
                    />
                    <Textarea
                      value={delivery.description}
                      onChange={(e) => updateDelivery(index, "description", e.target.value)}
                      placeholder="Descrição..."
                      className="min-h-[60px]"
                    />
                    <div className="grid grid-cols-4 gap-3">
                      <Input type="date" value={delivery.dueDate} onChange={(e) => updateDelivery(index, "dueDate", e.target.value)} />
                      <Select value={delivery.impact} onValueChange={(v) => updateDelivery(index, "impact", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {impacts.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select
                        value={delivery.cadence === "" ? CADENCE_NONE : delivery.cadence}
                        onValueChange={(v) => updateDelivery(index, "cadence", v === CADENCE_NONE ? "" : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Cadência" /></SelectTrigger>
                        <SelectContent>
                          {cadences.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input value={delivery.assignee} onChange={(e) => updateDelivery(index, "assignee", e.target.value)} placeholder="Responsável" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eventos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Workshops
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addWorkshop} className="gap-2">
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workshops.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum workshop</p>
                    </div>
                  ) : workshops.map((w, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/30">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Workshop #{i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeWorkshop(i)}><X className="h-4 w-4" /></Button>
                      </div>
                      <Input value={w.title} onChange={(e) => updateWorkshop(i, "title", e.target.value)} placeholder="Título" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" value={w.scheduledDate} onChange={(e) => updateWorkshop(i, "scheduledDate", e.target.value)} />
                        <Input value={w.duration} onChange={(e) => updateWorkshop(i, "duration", e.target.value)} placeholder="Duração" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users2 className="h-5 w-5 text-primary" />
                      Hotseats
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={addHotseat} className="gap-2">
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hotseats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum hotseat</p>
                    </div>
                  ) : hotseats.map((h, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/30">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Hotseat #{i + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeHotseat(i)}><X className="h-4 w-4" /></Button>
                      </div>
                      <Input value={h.title} onChange={(e) => updateHotseat(i, "title", e.target.value)} placeholder="Título" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" value={h.scheduledDate} onChange={(e) => updateHotseat(i, "scheduledDate", e.target.value)} />
                        <Input value={h.duration} onChange={(e) => updateHotseat(i, "duration", e.target.value)} placeholder="Duração" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contatos">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Contatos
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={addContact} className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum contato cadastrado</p>
                  </div>
                ) : contacts.map((contact, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Contato #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeContact(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={contact.name} onChange={(e) => updateContact(index, "name", e.target.value)} placeholder="Nome" />
                      <Input value={contact.role} onChange={(e) => updateContact(index, "role", e.target.value)} placeholder="Cargo" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="email" value={contact.email} onChange={(e) => updateContact(index, "email", e.target.value)} placeholder="Email" />
                      <Input value={contact.phone} onChange={(e) => updateContact(index, "phone", e.target.value)} placeholder="Telefone" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={contact.isDecisionMaker}
                        onChange={(e) => updateContact(index, "isDecisionMaker", e.target.checked)}
                        className="rounded"
                      />
                      É decisor
                    </label>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recursos">
            <ResourceManager companyId={id} />
          </TabsContent>

          <TabsContent value="diagnostico">
            <DiagnosticManager companyId={id} />
          </TabsContent>

          <TabsContent value="transcricoes">
            <TranscriptionManager companyId={id} csOwnerId={formData.csOwnerId || undefined} />
          </TabsContent>

          <TabsContent value="comentarios">
            <Card>
              <CardContent className="pt-6">
                <CompanyComments companyId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
