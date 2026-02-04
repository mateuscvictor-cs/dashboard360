"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Package,
  User,
  Calendar,
  DollarSign,
  Tag,
  Users,
  Building2,
  FileText,
  Upload,
  Link as LinkIcon,
  GraduationCap,
  Users2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  FileUp,
  FileSpreadsheet,
  Zap,
  HelpCircle,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wizard, WizardContent } from "@/components/ui/wizard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GuidedTour } from "@/components/tour/guided-tour";
import {
  TOUR_NOVA_EMPRESA_STEPS,
  TOUR_STORAGE_KEY,
  TOUR_START_PARAM,
  TOUR_START_STORAGE_KEY,
} from "@/lib/tour-nova-empresa-steps";
import { cn } from "@/lib/utils";
import type { ExtractedContractData } from "@/lib/prompts/contract-extraction";

type CadenceType = "daily" | "weekly" | "biweekly" | "monthly" | "custom" | "";

interface Delivery {
  title: string;
  description: string;
  dueDate: string;
  assignee: string;
  impact: "high" | "medium" | "low";
  cadence: CadenceType;
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

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  isDecisionMaker: boolean;
}

const segments = ["Enterprise", "Mid-Market", "SMB", "Startup"];
const frameworks = ["ICIA", "COPA", "ICIA Outsourcing", "CNH da IA", "Outro"];
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

function countDeliverablesByType(deliverables: ExtractedContractData["deliverables"], type: string): number {
  return deliverables.filter((d) => 
    d.name.toLowerCase().includes(type.toLowerCase())
  ).length;
}

const wizardSteps = [
  { id: "basics", title: "Dados" },
  { id: "assignment", title: "Equipe" },
  { id: "deliveries", title: "Entregas" },
  { id: "workshops", title: "Workshops" },
  { id: "hotseats", title: "Hotseats" },
  { id: "contacts", title: "Contatos" },
  { id: "documents", title: "Docs" },
];

type ImportMode = "manual" | "contract" | "csv" | "quick";

type CSOwnerOption = { id: string; name: string };
type SquadOption = { id: string; name: string };

function NovaEmpresaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedContractData | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [csOwners, setCsOwners] = useState<CSOwnerOption[]>([]);
  const [squads, setSquads] = useState<SquadOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDragging, setCsvDragging] = useState(false);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<{
    created: number;
    skipped: number;
    errors: number;
    skippedDetails: { row: number; name: string; reason: string }[];
    errorDetails: { row: number; name: string; message: string }[];
  } | null>(null);

  const [quickPasteText, setQuickPasteText] = useState("");
  const [quickRows, setQuickRows] = useState<{ name: string; csOwnerId: string }[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [csResponse, squadResponse] = await Promise.all([
          fetch("/api/cs-owners"),
          fetch("/api/squads"),
        ]);
        
        if (csResponse.ok) {
          const csData = await csResponse.json();
          setCsOwners(csData.map((cs: { id: string; name: string }) => ({ id: cs.id, name: cs.name })));
        }
        
        if (squadResponse.ok) {
          const squadData = await squadResponse.json();
          setSquads(squadData.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error("Erro ao buscar opções:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    
    fetchOptions();
  }, []);

  useEffect(() => {
    const fromParam = searchParams.get(TOUR_START_PARAM) === "1";
    const fromStorage = typeof sessionStorage !== "undefined" && sessionStorage.getItem(TOUR_START_STORAGE_KEY);
    if (fromParam || fromStorage) {
      setTourOpen(true);
      setTourStep(0);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete(TOUR_START_PARAM);
        window.history.replaceState({}, "", url.pathname + url.search);
        sessionStorage.removeItem(TOUR_START_STORAGE_KEY);
      }
    }
  }, [searchParams]);

  const handleTourClose = useCallback(() => {
    setTourOpen(false);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  const handleTourStepChange = useCallback((nextStep: number) => {
    if (nextStep === 0) {
      setImportMode(null);
    } else if (nextStep >= 1 && nextStep <= TOUR_NOVA_EMPRESA_STEPS.length - 1) {
      setImportMode("manual");
      setCurrentStep(nextStep - 1);
    }
    setTourStep(nextStep);
  }, []);

  const tourTriggerButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Aprenda a cadastrar e editar suas empresas"
            onClick={() => {
              setTourOpen(true);
              setTourStep(importMode === "manual" ? Math.min(1 + currentStep, TOUR_NOVA_EMPRESA_STEPS.length - 1) : 0);
            }}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          Aprenda a cadastrar e editar suas empresas
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
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
    contractFileDoc: null as File | null,
    proposalFile: null as File | null,
    fathomLink: "",
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [hotseats, setHotseats] = useState<Hotseat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setContractFile(file);
      setExtractError(null);
    } else {
      setExtractError("Apenas arquivos PDF são aceitos");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setContractFile(file);
        setExtractError(null);
      } else {
        setExtractError("Apenas arquivos PDF são aceitos");
      }
    }
  };

  const extractDataFromContract = async () => {
    if (!contractFile) return;

    setExtracting(true);
    setExtractError(null);

    try {
      const formData = new FormData();
      formData.append("file", contractFile);
      formData.append("action", "extract");

      const response = await fetch("/api/companies/from-contract", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao extrair dados");
      }

      setExtractedData(result.data);
      applyExtractedData(result.data);
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "Erro ao processar contrato");
    } finally {
      setExtracting(false);
    }
  };

  const applyExtractedData = (data: ExtractedContractData) => {
    setFormData((prev) => ({
      ...prev,
      name: data.company.name || prev.name,
      cnpj: data.company.cnpj || prev.cnpj,
      segment: data.company.segment || prev.segment,
      mrr: data.contract.mrr?.toString() || prev.mrr,
      startDate: data.contract.startDate || prev.startDate,
      expectedCompletion: data.contract.endDate || prev.expectedCompletion,
    }));

    if (data.contacts.length > 0) {
      setContacts(
        data.contacts.map((c) => ({
          name: c.name,
          email: c.email,
          role: c.role || "",
          phone: c.phone || "",
          isDecisionMaker: c.isDecisionMaker,
        }))
      );
    }

    if (data.deliverables.length > 0) {
      const mapFrequencyToCadence = (freq: string | null): CadenceType => {
        if (!freq) return "";
        const f = freq.toLowerCase();
        if (f.includes("diári") || f.includes("daily")) return "daily";
        if (f.includes("semanal") || f.includes("weekly")) return "weekly";
        if (f.includes("quinzenal") || f.includes("biweekly")) return "biweekly";
        if (f.includes("mensal") || f.includes("monthly")) return "monthly";
        return "custom";
      };

      const deliveryItems = data.deliverables.filter((i) => 
        i.pillar === "Processos" || (!i.pillar && !["workshop", "hotseat", "ipc"].includes(i.name.toLowerCase()))
      );
      setDeliveries(
        deliveryItems.map((d) => ({
          title: d.name,
          description: d.description || "",
          dueDate: "",
          assignee: "",
          impact: "medium" as const,
          cadence: mapFrequencyToCadence(d.frequency),
        }))
      );

      const workshopItems = data.deliverables.filter((i) => 
        i.name.toLowerCase().includes("workshop") || i.pillar === "Pessoas"
      );
      setWorkshops(
        workshopItems.map((w) => ({
          title: w.name,
          description: w.description || "",
          scheduledDate: "",
          duration: w.duration_hours ? `${w.duration_hours} horas` : "",
          participants: "",
          cadence: mapFrequencyToCadence(w.frequency),
        }))
      );

      const hotseatItems = data.deliverables.filter((i) => 
        i.name.toLowerCase().includes("hotseat")
      );
      setHotseats(
        hotseatItems.map((h) => ({
          title: h.name,
          description: h.description || "",
          scheduledDate: "",
          duration: h.duration_hours ? `${h.duration_hours} horas` : "",
          participants: "",
          cadence: mapFrequencyToCadence(h.frequency),
        }))
      );
    }

    setCurrentStep(0);
  };

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

  const canProceed = () => {
    if (currentStep === 0) {
      return formData.name.trim() !== "";
    }
    if (currentStep === 1) {
      return formData.csOwner !== "";
    }
    if (currentStep === 5) {
      return contacts.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (canProceed() && currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < wizardSteps.length - 1) return;
    if (!formData.name || !formData.csOwner || contacts.length === 0) {
      alert("Preencha os campos obrigatórios: Nome, CS Owner e pelo menos um contato");
      return;
    }

    setLoading(true);
    try {
      if (extractedData && contractFile) {
        const submitFormData = new FormData();
        submitFormData.append("file", contractFile);
        submitFormData.append("action", "create");
        submitFormData.append("extractedData", JSON.stringify(extractedData));

        const response = await fetch("/api/companies/from-contract", {
          method: "POST",
          body: submitFormData,
        });

        if (response.ok) {
          router.push("/admin/empresas");
          return;
        }
        const err = await response.json().catch(() => ({}));
        alert(err.error || "Erro ao criar empresa a partir do contrato");
        return;
      }

      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          cnpj: formData.cnpj || undefined,
          segment: formData.segment || undefined,
          framework: formData.framework === "Outro" ? formData.frameworkOther : formData.framework,
          billedAmount: formData.billedAmount || undefined,
          cashIn: formData.cashIn || undefined,
          mrr: formData.mrr || undefined,
          tags: formData.tags,
          csOwnerId: formData.csOwner || undefined,
          squadId: formData.squad || undefined,
          contractStart: formData.startDate || undefined,
          contractEnd: formData.expectedCompletion || undefined,
          fathomLink: formData.fathomLink || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || "Erro ao criar empresa");
        return;
      }
      router.push("/admin/empresas");
    } catch {
      alert("Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    setCsvImportLoading(true);
    setCsvImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const response = await fetch("/api/companies/import", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "Erro ao importar");
        return;
      }
      setCsvImportResult({
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors ?? 0,
        skippedDetails: data.skippedDetails ?? [],
        errorDetails: data.errorDetails ?? [],
      });
    } catch {
      alert("Erro ao importar empresas");
    } finally {
      setCsvImportLoading(false);
    }
  };

  const handleCsvDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setCsvDragging(true);
  }, []);

  const handleCsvDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setCsvDragging(false);
  }, []);

  const handleCsvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setCsvDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      setCsvFile(file);
      setCsvImportResult(null);
    }
  }, []);

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      setCsvFile(file);
      setCsvImportResult(null);
    }
  };

  const handleQuickGenerateList = () => {
    const names = quickPasteText
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    setQuickRows(names.map((name) => ({ name, csOwnerId: "" })));
    setQuickResult(null);
  };

  const handleQuickApplyCsToAll = (csOwnerId: string) => {
    setQuickRows((prev) => prev.map((r) => ({ ...r, csOwnerId })));
  };

  const handleQuickSetCs = (index: number, csOwnerId: string) => {
    setQuickRows((prev) => prev.map((r, i) => (i === index ? { ...r, csOwnerId } : r)));
  };

  const handleQuickCreate = async () => {
    const toCreate = quickRows.filter((r) => r.name.trim() && r.csOwnerId);
    if (toCreate.length === 0) {
      alert("Adicione nomes e selecione o CS Owner em cada linha (ou use \"CS para todos\")");
      return;
    }
    setQuickLoading(true);
    setQuickResult(null);
    let created = 0;
    let skipped = 0;
    let errors = 0;
    try {
      for (const row of toCreate) {
        try {
          const res = await fetch("/api/companies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: row.name.trim(), csOwnerId: row.csOwnerId }),
          });
          if (res.ok) created++;
          else {
            const data = await res.json().catch(() => ({}));
            if (res.status === 409 || (data.error && String(data.error).toLowerCase().includes("já existe"))) skipped++;
            else errors++;
          }
        } catch {
          errors++;
        }
      }
      setQuickResult({ created, skipped, errors });
    } finally {
      setQuickLoading(false);
    }
  };

  if (importMode === null) {
    return (
      <div className="flex flex-col h-full">
        <Header
          title="Nova Empresa"
          subtitle="Cadastre uma nova empresa e configure entregas"
          showFilters={false}
          action={tourTriggerButton}
        />
        <GuidedTour
          steps={TOUR_NOVA_EMPRESA_STEPS}
          isOpen={tourOpen}
          onClose={handleTourClose}
          currentStep={tourStep}
          onStepChange={handleTourStepChange}
          onComplete={handleTourClose}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/admin/empresas">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h2 className="text-xl font-bold">Como deseja cadastrar?</h2>
                <p className="text-sm text-muted-foreground">
                  Escolha entre importar dados de um contrato, planilha ou preencher manualmente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="nova-empresa-modos">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group",
                  "relative overflow-hidden"
                )}
                onClick={() => setImportMode("contract")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-4">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    Importar do Contrato
                    <Badge variant="secondary" className="text-xs">IA</Badge>
                    <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">BETA</Badge>
                  </CardTitle>
                  <CardDescription>
                    Faça upload do contrato PDF e deixe a IA extrair automaticamente os dados da empresa, contatos, entregáveis e mais.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Extração automática com OpenAI</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group relative overflow-hidden"
                onClick={() => setImportMode("csv")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <FileSpreadsheet className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <CardTitle>Importar em massa (CSV)</CardTitle>
                  <CardDescription>
                    Envie um CSV ou planilha com a lista de empresas para cadastrar várias de uma vez.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span>Upload de CSV</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group relative overflow-hidden"
                onClick={() => setImportMode("quick")}
              >
                <div className="absolute inset-0 bg-gradient-br from-muted/50 to-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Zap className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <CardTitle>Cadastro rápido</CardTitle>
                  <CardDescription>
                    Cole os nomes das empresas (um por linha), escolha o CS Owner e cadastre várias de uma vez.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Nome + CS Owner</span>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group relative overflow-hidden"
                onClick={() => setImportMode("manual")}
              >
                <div className="absolute inset-0 bg-gradient-br from-muted/50 to-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <CardTitle>Cadastro Manual</CardTitle>
                  <CardDescription>
                    Preencha manualmente todas as informações da empresa usando o formulário passo a passo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Controle total sobre os dados</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (importMode === "quick") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Nova Empresa" subtitle="Cadastro rápido: nome e CS Owner" showFilters={false} />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => { setImportMode(null); setQuickPasteText(""); setQuickRows([]); setQuickResult(null); }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Cadastro rápido</h2>
                <p className="text-sm text-muted-foreground">
                  Cole os nomes das empresas (um por linha), gere a lista e selecione o CS Owner em cada linha ou use &quot;CS para todos&quot;.
                </p>
              </div>
            </div>

            {quickResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                  <CardDescription>
                    {quickResult.created} criadas, {quickResult.skipped} ignoradas (já existem ou erro), {quickResult.errors} erros
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Link href="/admin/empresas">
                    <Button variant="outline">Voltar para lista</Button>
                  </Link>
                  <Button variant="outline" onClick={() => { setQuickResult(null); setQuickRows([]); setQuickPasteText(""); }}>
                    Cadastrar mais
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nomes das empresas (um por linha)</label>
                    <textarea
                      value={quickPasteText}
                      onChange={(e) => setQuickPasteText(e.target.value)}
                      placeholder="Empresa A
Empresa B
Empresa C"
                      rows={5}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                    />
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleQuickGenerateList}>
                      Gerar lista
                    </Button>
                  </div>

                  {quickRows.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">CS para todos:</span>
                        <select
                          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          value=""
                          onChange={(e) => { const v = e.target.value; if (v) handleQuickApplyCsToAll(v); }}
                        >
                          <option value="">Selecione...</option>
                          {csOwners.map((cs) => (
                            <option key={cs.id} value={cs.id}>{cs.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-3 font-medium">Nome</th>
                              <th className="text-left p-3 font-medium">CS Owner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quickRows.map((row, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="p-3">{row.name}</td>
                                <td className="p-2">
                                  <select
                                    className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    value={row.csOwnerId}
                                    onChange={(e) => handleQuickSetCs(i, e.target.value)}
                                  >
                                    <option value="">Selecione...</option>
                                    {csOwners.map((cs) => (
                                      <option key={cs.id} value={cs.id}>{cs.name}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          onClick={handleQuickCreate}
                          disabled={quickLoading}
                          className="gap-2 bg-gradient-brand hover:brightness-110"
                        >
                          {quickLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cadastrando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Cadastrar {quickRows.filter((r) => r.csOwnerId).length} empresas
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (importMode === "csv") {
    return (
      <div className="flex flex-col h-full">
        <Header title="Nova Empresa" subtitle="Importar empresas em massa via CSV" showFilters={false} />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => { setImportMode(null); setCsvFile(null); setCsvImportResult(null); }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Importar em massa</h2>
                <p className="text-sm text-muted-foreground">
                  Envie um CSV com as colunas: Clientes, CS Care, Tech Responsável, Início do Projeto, Final do Projeto, Framework, Status do Projeto, Link do NotebookLM, Link do ClickUP, Observações
                </p>
              </div>
            </div>

            {csvImportResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado da importação</CardTitle>
                  <CardDescription>
                    {csvImportResult.created} criadas, {csvImportResult.skipped} ignoradas (já existem), {csvImportResult.errors} erros
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {csvImportResult.errorDetails.length > 0 && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                      <p className="text-sm font-medium text-destructive">Erros</p>
                      <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-auto">
                        {csvImportResult.errorDetails.map((e, i) => (
                          <li key={i}>Linha {e.row} ({e.name}): {e.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {csvImportResult.skippedDetails.length > 0 && (
                    <div className="rounded-lg border border-muted p-3 space-y-2">
                      <p className="text-sm font-medium">Ignoradas (já existem)</p>
                      <ul className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-auto">
                        {csvImportResult.skippedDetails.map((s, i) => (
                          <li key={i}>Linha {s.row}: {s.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Link href="/admin/empresas">
                      <Button variant="outline">Voltar para lista</Button>
                    </Link>
                    <Button variant="outline" onClick={() => { setCsvFile(null); setCsvImportResult(null); }}>
                      Importar mais
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 text-center transition-all",
                      csvDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                      csvFile ? "border-success bg-success/5" : ""
                    )}
                    onDragOver={handleCsvDragOver}
                    onDragLeave={handleCsvDragLeave}
                    onDrop={handleCsvDrop}
                  >
                    {csvFile ? (
                      <div className="space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <div>
                          <p className="font-medium">{csvFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(csvFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setCsvFile(null); }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Arraste o CSV aqui</p>
                          <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                        </div>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCsvFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload">
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar CSV
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => { setImportMode(null); setCsvFile(null); setCsvImportResult(null); }}>
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCsvImport}
                      disabled={!csvFile || csvImportLoading}
                      className="gap-2 bg-gradient-brand hover:brightness-110"
                    >
                      {csvImportLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (importMode === "contract" && !extractedData) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Importar do Contrato" subtitle="Faça upload do contrato para extração automática" showFilters={false} />

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setImportMode(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Upload do Contrato
                  <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">BETA</Badge>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Envie o arquivo PDF do contrato para extrair os dados automaticamente
                </p>
              </div>
            </div>

            <Card>
              <CardContent className="p-8">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    contractFile ? "border-success bg-success/5" : ""
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {contractFile ? (
                    <div className="space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{contractFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setContractFile(null);
                          setExtractError(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Arraste o contrato aqui</p>
                        <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="contract-upload-main"
                      />
                      <label htmlFor="contract-upload-main">
                        <Button variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar PDF
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>

                {extractError && (
                  <div className="mt-4 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-danger">Erro na extração</p>
                      <p className="text-sm text-danger/80">{extractError}</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setImportMode(null)}>
                    Voltar
                  </Button>
                  <Button
                    onClick={extractDataFromContract}
                    disabled={!contractFile || extracting}
                    className="gap-2 bg-gradient-brand hover:brightness-110"
                  >
                    {extracting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extraindo dados...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Extrair com IA
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 p-4 rounded-xl bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                O que será extraído?
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Dados da empresa (nome, CNPJ, segmento)</li>
                <li>Contatos e responsáveis</li>
                <li>Datas de início e fim do contrato</li>
                <li>Valor mensal (MRR)</li>
                <li>Workshops, Hotseats e IPCs contratados</li>
                <li>Encontros periódicos</li>
                <li>Entregáveis e prazos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card data-tour="wizard-step-basics">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Dados Básicos</CardTitle>
                {extractedData && (
                  <Badge variant="secondary" className="ml-auto">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Extraído via IA
                  </Badge>
                )}
              </div>
              <CardDescription>Informações principais da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Ex: TechCorp Brasil"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Segmento</label>
                  <select
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Selecione...</option>
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
                    <option value="">Selecione...</option>
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
                    placeholder="0.00"
                    step="0.01"
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
                    placeholder="0.00"
                    step="0.01"
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
                    placeholder="0.00"
                    step="0.01"
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
                <label className="text-sm font-medium mb-2 block">Status Inicial</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="active">Ativo</option>
                  <option value="pending">Pendente</option>
                  <option value="onboarding">Onboarding</option>
                </select>
              </div>

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
        );

      case 1:
        return (
          <Card data-tour="wizard-step-assignment">
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
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Carregando..." : "Selecione..."}</option>
                  {csOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
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
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Carregando..." : "Selecione..."}</option>
                  {squads.map((squad) => (
                    <option key={squad.id} value={squad.id}>
                      {squad.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card data-tour="wizard-step-deliveries">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle>Entregáveis Iniciais</CardTitle>
                  {extractedData && deliveries.length > 0 && (
                    <Badge variant="secondary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {deliveries.length} extraídos
                    </Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addDelivery} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              <CardDescription>Configure as entregas iniciais do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma entrega adicionada</p>
                  <p className="text-xs mt-1">Clique em "Adicionar" para começar</p>
                </div>
              ) : (
                deliveries.map((delivery, index) => (
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
                        placeholder="Ex: Integração com ERP"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block">Descrição</label>
                      <textarea
                        value={delivery.description}
                        onChange={(e) => updateDelivery(index, "description", e.target.value)}
                        className="w-full min-h-[60px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        placeholder="Descreva a entrega..."
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
                          {csOwners.map((cs) => (
                            <option key={cs.id} value={cs.id}>
                              {cs.name}
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card data-tour="wizard-step-workshops">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <CardTitle>Workshops</CardTitle>
                  {extractedData && (
                    <Badge variant="secondary">
                      {countDeliverablesByType(extractedData.deliverables, "workshop")} contratados
                    </Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addWorkshop} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              <CardDescription>Configure os workshops do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workshops.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum workshop adicionado</p>
                  <p className="text-xs mt-1">Clique em "Adicionar" para começar</p>
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card data-tour="wizard-step-hotseats">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-primary" />
                  <CardTitle>Hotseats</CardTitle>
                  {extractedData && (
                    <Badge variant="secondary">
                      {countDeliverablesByType(extractedData.deliverables, "hotseat")} contratados
                    </Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addHotseat} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              <CardDescription>Configure os hotseats do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hotseats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum hotseat adicionado</p>
                  <p className="text-xs mt-1">Clique em "Adicionar" para começar</p>
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
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card data-tour="wizard-step-contacts">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Contatos</CardTitle>
                  {extractedData && contacts.length > 0 && (
                    <Badge variant="secondary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {contacts.length} extraídos
                    </Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              <CardDescription>
                Adicione os contatos principais da empresa <span className="text-danger">*</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum contato adicionado</p>
                  <p className="text-xs mt-1">É necessário adicionar pelo menos um contato</p>
                </div>
              ) : (
                contacts.map((contact, index) => (
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
                          placeholder="Nome completo"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium mb-1 block">Cargo</label>
                        <input
                          type="text"
                          value={contact.role}
                          onChange={(e) => updateContact(index, "role", e.target.value)}
                          className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Ex: CTO, CEO"
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
                          placeholder="email@empresa.com"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium mb-1 block">Telefone</label>
                        <input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateContact(index, "phone", e.target.value)}
                          className="w-full h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="+55 11 99999-9999"
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
                ))
              )}
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-tour="wizard-step-documents">
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
                      onChange={(e) => setFormData({ ...formData, contractFileDoc: e.target.files?.[0] || null })}
                      className="hidden"
                      id="contract-upload-doc"
                    />
                    <label
                      htmlFor="contract-upload-doc"
                      className="flex-1 h-10 rounded-lg border border-dashed bg-muted/50 flex items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formData.contractFileDoc ? formData.contractFileDoc.name : contractFile ? contractFile.name : "Anexar contrato"}
                      </span>
                    </label>
                    {(formData.contractFileDoc || contractFile) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setFormData({ ...formData, contractFileDoc: null })}
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
                      id="proposal-upload"
                    />
                    <label
                      htmlFor="proposal-upload"
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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Configurações do Projeto</CardTitle>
                </div>
                <CardDescription>Defina as datas do projeto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data de Início</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Conclusão Prevista</label>
                  <input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData({ ...formData, expectedCompletion: e.target.value })}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {extractedData && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Resumo da Extração
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Total de entregáveis: {extractedData.deliverables.length}</p>
                      <p>Workshops: {countDeliverablesByType(extractedData.deliverables, "workshop")}</p>
                      <p>Hotseats: {countDeliverablesByType(extractedData.deliverables, "hotseat")}</p>
                      <p>IPCs/Agentes: {extractedData.deliverables.filter(d => d.pillar === "Tecnologia").length}</p>
                      {extractedData.contract.term_months && (
                        <p>Vigência: {extractedData.contract.term_months} meses</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Nova Empresa"
        subtitle="Cadastre uma nova empresa e configure entregas"
        showFilters={false}
        action={tourTriggerButton}
      />
      <GuidedTour
        steps={TOUR_NOVA_EMPRESA_STEPS}
        isOpen={tourOpen}
        onClose={handleTourClose}
        currentStep={tourStep}
        onStepChange={handleTourStepChange}
        onComplete={handleTourClose}
      />
      <div className="flex-1 overflow-auto p-6">
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep < wizardSteps.length - 1) e.preventDefault();
          }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => {
                if (extractedData) {
                  setExtractedData(null);
                  setImportMode(null);
                } else {
                  setImportMode(null);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Dados da Empresa
                {extractedData && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Importado via IA
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {extractedData
                  ? "Revise e ajuste os dados extraídos do contrato"
                  : "Preencha as informações básicas e configure o projeto"}
              </p>
            </div>
          </div>

          <Card className="p-6">
            <Wizard
              steps={wizardSteps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </Card>

          <AnimatePresence mode="wait">
            <WizardContent key={currentStep} className="min-h-[400px]">
              {renderStepContent()}
            </WizardContent>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={handlePrevious} className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/empresas">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              {currentStep < wizardSteps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="gap-2 bg-gradient-brand hover:brightness-110"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading || !canProceed()} className="gap-2 bg-gradient-brand hover:brightness-110">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Criar Empresa
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NovaEmpresaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NovaEmpresaContent />
    </Suspense>
  );
}
