"use client";

import { motion } from "framer-motion";
import {
    Sparkles,
    Zap,
    TrendingUp,
    Clock,
    ArrowRight,
    CheckCircle2,
    FileText,
    PlayCircle,
    MessageSquare,
    HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

// --- Types ---
type UserInfo = {
    name: string | null;
    companyName: string;
};

type Metric = {
    label: string;
    value: string | number;
    change?: string;
    trend?: "up" | "down" | "neutral";
    icon: any;
    color: string;
};

type ActivityItem = {
    id: string;
    title: string;
    type: "resource" | "update" | "alert";
    timestamp: string;
};

// --- Components ---

export function WelcomeHero({ user }: { user: UserInfo }) {
    const firstName = user.name?.split(" ")[0] || "Membro";

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 shadow-xl">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 text-white">
                    <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-2">
                        Área do Membro
                    </Badge>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Olá, {firstName}! 👋
                    </h1>
                    <p className="text-indigo-100 max-w-lg text-lg">
                        Bem-vindo à central da {user.companyName}. Aqui você encontra recursos e ferramentas para impulsionar seus resultados.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 shadow-lg border-0" onClick={() => window.location.href = "/membro/recursos"}>
                        <Sparkles className="mr-2 h-4 w-4" /> Explorar Recursos
                    </Button>
                    <Button size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10" onClick={() => window.open("/membro/suporte", "_blank")}>
                        <HelpCircle className="mr-2 h-4 w-4" /> Ajuda
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function StatsOverview() {
    // Mock Data for now
    const metrics: Metric[] = [
        { label: "Recursos Acessados", value: "12", change: "+2 essa semana", trend: "up", icon: FileText, color: "from-blue-500 to-cyan-500" },
        { label: "Automações Ativas", value: "3", icon: Zap, color: "from-amber-500 to-orange-500" },
        { label: "Economia Estimada", value: "5h", change: "semanal", trend: "up", icon: Clock, color: "from-emerald-500 to-teal-500" },
        { label: "Engajamento", value: "Alto", icon: TrendingUp, color: "from-purple-500 to-pink-500" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <Card key={index} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", metric.color)}>
                                <metric.icon className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground line-clamp-1">{metric.label}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
                            {metric.change && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {metric.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                                    {metric.change}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function RecentActivityFeed() {
    // Mock Data
    const activities: ActivityItem[] = [
        { id: "1", title: "Novo playbook de Vendas adicionado", type: "resource", timestamp: "Há 2 horas" },
        { id: "2", title: "Automação de e-mail atualizada", type: "update", timestamp: "Ontem" },
        { id: "3", title: "Reunião de alinhamento agendada", type: "alert", timestamp: "Há 2 dias" },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Atividade Recente
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
                <div className="relative pl-4 border-l border-muted space-y-6">
                    {activities.map((item) => (
                        <div key={item.id} className="relative">
                            <div className={cn(
                                "absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background",
                                item.type === "resource" ? "bg-blue-500" :
                                    item.type === "update" ? "bg-emerald-500" : "bg-orange-500"
                            )} />
                            <div>
                                <p className="text-sm font-medium leading-none">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.timestamp}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-xs text-muted-foreground">
                    Ver histórico completo
                </Button>
            </CardContent>
        </Card>
    );
}

export function FeaturedResourceCard() {
    return (
        <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800')] opacity-10 mix-blend-overlay bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
            <CardContent className="relative z-10 p-6 flex flex-col h-full justify-between min-h-[200px]">
                <div className="space-y-2">
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-none">
                        Destaque da Semana
                    </Badge>
                    <h3 className="text-xl font-bold">Masterclass: Gestão de Tempo</h3>
                    <p className="text-slate-300 text-sm line-clamp-2">
                        Aprenda as técnicas mais eficientes para organizar sua agenda e priorizar tarefas de alto impacto.
                    </p>
                </div>
                <Button size="sm" className="w-fit mt-4 bg-white text-slate-900 hover:bg-slate-100">
                    <PlayCircle className="mr-2 h-4 w-4" /> Assistir Agora
                </Button>
            </CardContent>
        </Card>
    );
}
