"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    DollarSign,
    TrendingUp,
    Megaphone,
    Users,
    Settings,
    Sparkles,
    Loader2,
    FolderOpen,
    ExternalLink,
    LayoutGrid,
    List,
    FileText,
    CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    WelcomeHero,
    StatsOverview,
    FeaturedResourceCard,
} from "@/components/membro/dashboard-widgets";
import { useUserProfile } from "@/components/layout/user-avatar";

// --- Definitions ---
const areas = [
    { id: "all", name: "Todas as Áreas", icon: LayoutGrid, color: "from-slate-500 to-zinc-500" },
    { id: "automacao", name: "Automação", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { id: "financeiro", name: "Financeiro", icon: DollarSign, color: "from-emerald-500 to-teal-500" },
    { id: "vendas", name: "Vendas", icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { id: "marketing", name: "Marketing", icon: Megaphone, color: "from-pink-500 to-rose-500" },
    { id: "rh", name: "RH", icon: Users, color: "from-purple-500 to-violet-500" },
    { id: "operacoes", name: "Operações", icon: Settings, color: "from-indigo-500 to-blue-500" },
];

const governancaCategories = [
    { id: "all", name: "Todas as Categorias", icon: LayoutGrid, color: "from-slate-500 to-zinc-500" },
    { id: "politicas", name: "Políticas", icon: FileText, color: "from-blue-500 to-indigo-500" },
    { id: "conformidade", name: "Conformidade", icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
    { id: "seguranca", name: "Segurança", icon: Settings, color: "from-red-500 to-orange-500" },
];

type Resource = {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category: string;
    targetAudience: string | null;
    link: string | null;
    createdAt: string;
};

export default function MembroDashboardPage() {
    const { user, loading: userLoading } = useUserProfile();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("time-ia");

    // Filters state
    const [selectedArea, setSelectedArea] = useState("all");
    const [selectedGovCategory, setSelectedGovCategory] = useState("all");

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const [resourcesRes, companyRes] = await Promise.all([
                    fetch("/api/cliente/recursos"),
                    fetch("/api/cliente/company")
                ]);

                if (resourcesRes.ok) {
                    const data = await resourcesRes.json();
                    setResources(data.resources || []);
                }

                if (companyRes.ok) {
                    const data = await companyRes.json();
                    setCompanyName(data.name || "Sua Empresa");
                }

            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter logic
    const filteredResources = resources.filter((r) => {
        if (activeTab === "time-ia") {
            return selectedArea === "all" || r.category?.toLowerCase() === selectedArea;
        } else {
            // Mocking governance filter for now since resources might not have these categories yet
            // In a real scenario, check r.category or r.type against selectedGovCategory
            if (selectedGovCategory === "all") return true;
            return r.category?.toLowerCase() === selectedGovCategory;
        }
    });

    if (loading || userLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* 1. Hero Section */}
            <WelcomeHero user={{ name: user?.name || "Membro", companyName }} />

            {/* 2. Stats Section */}
            <StatsOverview />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Resources (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">

                    <div className="space-y-6">
                        <Tabs defaultValue="time-ia" onValueChange={setActiveTab} className="w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <TabsList className="w-full sm:w-auto grid grid-cols-2">
                                    <TabsTrigger value="time-ia">Time de IA</TabsTrigger>
                                    <TabsTrigger value="governanca">Governança de IA</TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg self-start sm:self-auto">
                                    <Button
                                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                        className="h-8 px-2"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === "list" ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setViewMode("list")}
                                        className="h-8 px-2"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* === TIME DE IA === */}
                            <TabsContent value="time-ia" className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight mb-4">IPCs Disponíveis</h2>
                                    {/* Areas Filter */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {areas.map((area) => {
                                            const isActive = selectedArea === area.id;
                                            return (
                                                <Button
                                                    key={area.id}
                                                    variant={isActive ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setSelectedArea(area.id)}
                                                    className={cn(
                                                        "gap-2 transition-all rounded-full",
                                                        isActive && "shadow-md ring-2 ring-primary/20 ring-offset-1"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex h-4 w-4 items-center justify-center rounded-full",
                                                            isActive
                                                                ? "bg-white/20"
                                                                : `bg-gradient-to-br ${area.color} text-white`
                                                        )}
                                                    >
                                                        <area.icon className="h-2.5 w-2.5" />
                                                    </div>
                                                    {area.name}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {/* Resource Grid (IPCs) */}
                                    <ResourceGrid
                                        resources={filteredResources}
                                        viewMode={viewMode}
                                        emptyMessage="Nenhum IPC encontrado nesta área."
                                        typeLabel="IPC"
                                        categories={areas}
                                    />
                                </div>
                            </TabsContent>

                            {/* === GOVERNANÇA DE IA === */}
                            <TabsContent value="governanca" className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight mb-4">Ativos de Governança</h2>
                                    {/* Categories Filter */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {governancaCategories.map((cat) => {
                                            const isActive = selectedGovCategory === cat.id;
                                            return (
                                                <Button
                                                    key={cat.id}
                                                    variant={isActive ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setSelectedGovCategory(cat.id)}
                                                    className={cn(
                                                        "gap-2 transition-all rounded-full",
                                                        isActive && "shadow-md ring-2 ring-primary/20 ring-offset-1"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex h-4 w-4 items-center justify-center rounded-full",
                                                            isActive
                                                                ? "bg-white/20"
                                                                : `bg-gradient-to-br ${cat.color} text-white`
                                                        )}
                                                    >
                                                        <cat.icon className="h-2.5 w-2.5" />
                                                    </div>
                                                    {cat.name}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {/* Resource Grid (Assets) */}
                                    <ResourceGrid
                                        resources={filteredResources}
                                        viewMode={viewMode}
                                        emptyMessage="Nenhum ativo encontrado nesta categoria."
                                        typeLabel="Ativo"
                                        categories={governancaCategories}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Right Column: Widgets (1/3 width) */}
                <div className="space-y-6">
                    <div className="hidden lg:block">
                        <FeaturedResourceCard />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResourceGrid({ resources, viewMode, emptyMessage, typeLabel, categories }: { resources: Resource[], viewMode: "grid" | "list", emptyMessage: string, typeLabel: string, categories: any[] }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {resources.length === 0 ? (
                    <Card className="border-dashed bg-muted/10">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <h3 className="font-semibold text-muted-foreground">
                                Nenhum recurso encontrado
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
                                {emptyMessage}
                            </p>
                        </CardContent>
                    </Card>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} typeLabel={typeLabel} categories={categories} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resources.map((resource) => (
                            <ResourceListItem key={resource.id} resource={resource} typeLabel={typeLabel} categories={categories} />
                        ))}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

function ResourceCard({ resource, typeLabel, categories }: { resource: Resource, typeLabel: string, categories: any[] }) {
    const category = categories.find((c) => c.id === resource.category?.toLowerCase());

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-muted/60">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-black/5",
                            category?.color || "from-slate-500 to-zinc-500"
                        )}
                    >
                        {category ? (
                            <category.icon className="h-5 w-5 text-white" />
                        ) : (
                            <Sparkles className="h-5 w-5 text-white" />
                        )}
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                        {typeLabel}
                    </Badge>
                </div>
                <CardTitle className="text-base mt-4 group-hover:text-primary transition-colors line-clamp-1">
                    {resource.title}
                </CardTitle>
                {resource.description && (
                    <CardDescription className="line-clamp-2 text-xs mt-1.5">
                        {resource.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between mt-2">
                    {resource.targetAudience ? (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
                            {resource.targetAudience}
                        </Badge>
                    ) : <span />}
                    {resource.link && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs h-7 px-2 -mr-2 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => window.open(resource.link!, "_blank")}
                        >
                            Acessar <ExternalLink className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ResourceListItem({ resource, typeLabel, categories }: { resource: Resource, typeLabel: string, categories: any[] }) {
    const category = categories.find((c) => c.id === resource.category?.toLowerCase());

    return (
        <Card className="group hover:shadow-md transition-all duration-200 border-muted/60">
            <CardContent className="flex items-center gap-4 p-3">
                <div
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
                        category?.color || "from-slate-500 to-zinc-500"
                    )}
                >
                    {category ? (
                        <category.icon className="h-5 w-5 text-white" />
                    ) : (
                        <Sparkles className="h-5 w-5 text-white" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                        {resource.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1 h-4">
                            {typeLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {resource.description}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {resource.link && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => window.open(resource.link!, "_blank")}
                            className="text-muted-foreground hover:text-primary"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
