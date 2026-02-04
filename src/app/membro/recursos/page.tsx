"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const categories = [
    { id: "all", name: "Todos", icon: SlidersHorizontal, color: "from-slate-500 to-zinc-500" },
    { id: "automacao", name: "Automação", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { id: "financeiro", name: "Financeiro", icon: DollarSign, color: "from-emerald-500 to-teal-500" },
    { id: "vendas", name: "Vendas", icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { id: "marketing", name: "Marketing", icon: Megaphone, color: "from-pink-500 to-rose-500" },
    { id: "rh", name: "RH", icon: Users, color: "from-purple-500 to-violet-500" },
    { id: "operacoes", name: "Operações", icon: Settings, color: "from-indigo-500 to-blue-500" },
];

type Resource = {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category: string;
    targetAudience: string | null;
    link: string | null;
};

export default function RecursosPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchResources() {
            try {
                const response = await fetch("/api/cliente/recursos");
                if (response.ok) {
                    const data = await response.json();
                    setResources(data.resources || []);
                }
            } catch (error) {
                console.error("Erro ao buscar recursos:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchResources();
    }, []);

    const filteredResources = resources.filter((r) => {
        const matchesCategory =
            selectedCategory === "all" || r.category?.toLowerCase() === selectedCategory;
        const matchesSearch =
            !searchQuery ||
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Recursos</h1>
                <p className="text-muted-foreground mt-2">
                    Todos os recursos, automações e ferramentas disponíveis para você.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar recursos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const isActive = selectedCategory === category.id;
                        return (
                            <Button
                                key={category.id}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn("gap-2", isActive && "shadow-md")}
                            >
                                <category.icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{category.name}</span>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground">
                            Nenhum recurso encontrado
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tente ajustar os filtros ou a busca.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map((resource, index) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <ResourceCard resource={resource} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ResourceCard({ resource }: { resource: Resource }) {
    const category = categories.find((c) => c.id === resource.category?.toLowerCase());

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            <CardHeader className="pb-3 flex-1">
                <div className="flex items-start justify-between">
                    <div
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm",
                            category?.color || "from-slate-500 to-zinc-500"
                        )}
                    >
                        {category ? (
                            <category.icon className="h-5 w-5 text-white" />
                        ) : (
                            <Sparkles className="h-5 w-5 text-white" />
                        )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        {resource.type || "Recurso"}
                    </Badge>
                </div>
                <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
                    {resource.title}
                </CardTitle>
                {resource.description && (
                    <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="pt-0 mt-auto">
                <div className="flex items-center justify-between gap-2">
                    {resource.targetAudience && (
                        <Badge variant="outline" className="text-xs truncate max-w-[150px]">
                            Para: {resource.targetAudience}
                        </Badge>
                    )}
                    {resource.link && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs shrink-0"
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
