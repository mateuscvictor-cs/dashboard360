"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  Target,
  Users,
  RefreshCw,
  Calendar,
  Building2,
  Loader2,
  ChevronRight,
  Activity,
  Heart,
  Star,
  Rocket,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PerformanceCard,
  PerformanceChart,
  RankingTable,
  GoalsProgress,
} from "@/components/cs-performance";
import { cn } from "@/lib/utils";
import type { PerformanceMetric, PerformancePeriod } from "@prisma/client";

type CSWithSnapshot = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  accountsCount: number;
  latestSnapshot: {
    id: string;
    date: string;
    performanceScore: number;
    scoreExecution: number;
    scorePortfolio: number;
    scoreEngagement: number;
    scoreSatisfaction: number;
    accountsTotal: number;
    accountsAtRisk: number;
    accountsHealthy: number;
    avgHealthScore: number;
    npsAverage: number;
    csatAverage: number;
    deliveriesTotal: number;
    deliveriesOnTime: number;
    deliveriesCompleted: number;
    ranking: number;
  } | null;
};

type TeamAverages = {
  performanceScore: number;
  scoreExecution: number;
  scorePortfolio: number;
  scoreEngagement: number;
  scoreSatisfaction: number;
  avgHealthScore: number;
  npsAverage: number;
  csatAverage: number;
  totalCS: number;
};

type RankingItem = {
  id: string;
  ranking: number;
  performanceScore: number;
  scoreExecution: number;
  scorePortfolio: number;
  scoreEngagement: number;
  scoreSatisfaction: number;
  accountsTotal: number;
  accountsAtRisk: number;
  csOwner: {
    id: string;
    name: string;
    avatar: string | null;
    email: string;
  };
};

type GoalWithProgress = {
  goal: {
    id: string;
    metric: PerformanceMetric;
    targetValue: number;
    period: PerformancePeriod;
    startDate: string;
    endDate: string;
    csOwner?: { id: string; name: string } | null;
  };
  currentValue: number;
  progress: number;
  remaining: number;
};

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-600",
];

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [csOwners, setCsOwners] = useState<CSWithSnapshot[]>([]);
  const [teamAverages, setTeamAverages] = useState<TeamAverages | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [performanceRes, rankingRes, goalsRes] = await Promise.all([
        fetch("/api/cs-performance"),
        fetch("/api/cs-performance/ranking"),
        fetch("/api/cs-performance/goals"),
      ]);

      if (performanceRes.ok) {
        const data = await performanceRes.json();
        setCsOwners(data.csOwners || []);
        setTeamAverages(data.teamAverages);
      }

      if (rankingRes.ok) {
        const data = await rankingRes.json();
        setRanking(data);
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        const goalsWithProgress = await Promise.all(
          goalsData.map(async (goal: { id: string }) => {
            const progressRes = await fetch(`/api/cs-performance/goals/${goal.id}`);
            if (progressRes.ok) {
              return progressRes.json();
            }
            return null;
          })
        );
        setGoals(goalsWithProgress.filter(Boolean) as GoalWithProgress[]);
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
    }
    setLoading(false);
  };

  const handleCalculateSnapshots = async () => {
    setCalculating(true);
    try {
      const res = await fetch("/api/cs-performance", { method: "POST" });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Error calculating snapshots:", error);
    }
    setCalculating(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const topPerformers = ranking.slice(0, 3);
  const avgScore = teamAverages?.performanceScore || 0;
  const totalAccounts = csOwners.reduce((sum, cs) => sum + cs.accountsCount, 0);
  const totalAtRisk = ranking.reduce((sum, r) => sum + r.accountsAtRisk, 0);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Performance" subtitle="Análise de performance da equipe CS" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Performance" subtitle="Análise de performance da equipe CS" showFilters={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("week")}
            >
              Semana
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              Mês
            </Button>
            <Button
              variant={period === "quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("quarter")}
            >
              Trimestre
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCalculateSnapshots}
            disabled={calculating}
          >
            {calculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar Métricas
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <PerformanceCard
            title="Score Médio"
            value={avgScore}
            format="score"
            icon={Trophy}
            colorScheme={avgScore >= 70 ? "success" : avgScore >= 50 ? "warning" : "danger"}
            subtitle={`${csOwners.length} CS ativos`}
          />
          <PerformanceCard
            title="Health Score"
            value={teamAverages?.avgHealthScore || 0}
            format="score"
            icon={Heart}
            colorScheme="primary"
            subtitle="Média do portfólio"
          />
          <PerformanceCard
            title="NPS Médio"
            value={teamAverages?.npsAverage || 0}
            format="score"
            icon={Star}
            colorScheme={(teamAverages?.npsAverage || 0) >= 8 ? "success" : "warning"}
            subtitle="Últimos 30 dias"
          />
          <PerformanceCard
            title="Empresas"
            value={totalAccounts}
            format="number"
            icon={Building2}
            colorScheme="primary"
            subtitle={totalAtRisk > 0 ? `${totalAtRisk} em risco` : "Portfólio saudável"}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="ranking">
              Ranking
              <Badge variant="secondary" size="sm" className="ml-2">{ranking.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PerformanceChart
                  data={ranking.length > 0 ? ranking.map((r, i) => ({
                    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                    performanceScore: r.performanceScore,
                    scoreExecution: r.scoreExecution,
                    scorePortfolio: r.scorePortfolio,
                  })).reverse() : []}
                  showBreakdown
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
                    <CardDescription>Os 3 melhores CS do período</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {topPerformers.map((performer, index) => {
                        const gradientClass = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                        const medals = ["🥇", "🥈", "🥉"];

                        return (
                          <Link key={performer.id} href={`/admin/operacao/cs/${performer.csOwner.id}`}>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={cn(
                                "relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                                index === 0 && "border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5"
                              )}
                            >
                              <div className="absolute -top-3 -right-3 text-2xl">
                                {medals[index]}
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                  "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white text-sm font-bold shadow-lg",
                                  gradientClass
                                )}>
                                  {performer.csOwner.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold">{performer.csOwner.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {performer.accountsTotal} empresas
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-3xl font-bold">{performer.performanceScore.toFixed(0)}</p>
                                  <p className="text-xs text-muted-foreground">pontos</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </motion.div>
                          </Link>
                        );
                      })}
                      {topPerformers.length === 0 && (
                        <div className="col-span-3 text-center py-8 text-muted-foreground">
                          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Nenhum dado de performance disponível</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={handleCalculateSnapshots}
                          >
                            Calcular agora
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Média por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-emerald-500" />
                            <span>Execução</span>
                          </div>
                          <span className="font-semibold">
                            {(teamAverages?.scoreExecution || 0).toFixed(1)}/40
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            style={{ width: `${((teamAverages?.scoreExecution || 0) / 40) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>Portfólio</span>
                          </div>
                          <span className="font-semibold">
                            {(teamAverages?.scorePortfolio || 0).toFixed(1)}/30
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                            style={{ width: `${((teamAverages?.scorePortfolio || 0) / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span>Engajamento</span>
                          </div>
                          <span className="font-semibold">
                            {(teamAverages?.scoreEngagement || 0).toFixed(1)}/20
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            style={{ width: `${((teamAverages?.scoreEngagement || 0) / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span>Satisfação</span>
                          </div>
                          <span className="font-semibold">
                            {(teamAverages?.scoreSatisfaction || 0).toFixed(1)}/10
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${((teamAverages?.scoreSatisfaction || 0) / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <GoalsProgress goals={goals} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="mt-6">
            <RankingTable data={ranking} />
          </TabsContent>

          <TabsContent value="goals" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalsProgress goals={goals} />
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Criar Nova Meta</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/operacao/performance/goals/new">
                    <Button className="w-full gap-2">
                      <Target className="h-4 w-4" />
                      Criar Meta
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {csOwners.map((cs, index) => {
                const snapshot = cs.latestSnapshot;
                const gradientClass = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

                return (
                  <Link key={cs.id} href={`/admin/operacao/cs/${cs.id}`}>
                    <Card className="hover:shadow-md transition-all cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white font-bold shadow-lg",
                              gradientClass
                            )}>
                              {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold">{cs.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {cs.accountsCount} empresas
                              </p>
                            </div>
                          </div>
                          {snapshot && (
                            <Badge
                              variant={snapshot.ranking <= 3 ? "healthy" : "secondary"}
                              size="sm"
                            >
                              #{snapshot.ranking}
                            </Badge>
                          )}
                        </div>

                        {snapshot ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Score</span>
                              <span className={cn(
                                "text-2xl font-bold",
                                snapshot.performanceScore >= 70 ? "text-emerald-600" :
                                snapshot.performanceScore >= 50 ? "text-amber-600" :
                                "text-red-600"
                              )}>
                                {snapshot.performanceScore.toFixed(0)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                              <div className="p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Exec</p>
                                <p className="font-semibold text-sm">{snapshot.scoreExecution.toFixed(0)}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Port</p>
                                <p className="font-semibold text-sm">{snapshot.scorePortfolio.toFixed(0)}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Eng</p>
                                <p className="font-semibold text-sm">{snapshot.scoreEngagement.toFixed(0)}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Sat</p>
                                <p className="font-semibold text-sm">{snapshot.scoreSatisfaction.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            Sem dados de performance
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
