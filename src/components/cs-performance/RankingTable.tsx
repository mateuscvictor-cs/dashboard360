"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RankingItem {
  id: string;
  ranking: number;
  csOwner: {
    id: string;
    name: string;
    avatar: string | null;
    email: string;
  };
  performanceScore: number;
  scoreExecution: number;
  scorePortfolio: number;
  scoreEngagement: number;
  scoreSatisfaction: number;
  accountsTotal: number;
  accountsAtRisk: number;
}

interface RankingTableProps {
  data: RankingItem[];
  highlightId?: string;
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-600",
];

const getRankingIcon = (ranking: number) => {
  switch (ranking) {
    case 1:
      return <Trophy className="h-5 w-5 text-amber-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">{ranking}º</span>;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-emerald-500/10";
  if (score >= 60) return "bg-amber-500/10";
  return "bg-red-500/10";
};

export function RankingTable({ data, highlightId }: RankingTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Ranking de Performance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhum dado de ranking disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Ranking de Performance</CardTitle>
          </div>
          <Badge variant="secondary" size="sm">
            {data.length} CS
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, index) => {
            const isHighlighted = item.csOwner.id === highlightId;
            const gradientClass = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  isHighlighted
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50",
                  item.ranking <= 3 && "bg-muted/30"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankingIcon(item.ranking)}
                </div>

                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white text-sm font-bold shadow-md shrink-0",
                  gradientClass
                )}>
                  {item.csOwner.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.csOwner.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {item.accountsTotal} empresas
                    </span>
                    {item.accountsAtRisk > 0 && (
                      <Badge variant="danger" size="sm" className="text-[10px] h-4">
                        {item.accountsAtRisk} em risco
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Exec</p>
                    <p className="text-xs font-semibold">{item.scoreExecution.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Port</p>
                    <p className="text-xs font-semibold">{item.scorePortfolio.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Eng</p>
                    <p className="text-xs font-semibold">{item.scoreEngagement.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Sat</p>
                    <p className="text-xs font-semibold">{item.scoreSatisfaction.toFixed(0)}</p>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-center w-14 h-10 rounded-lg",
                  getScoreBg(item.performanceScore)
                )}>
                  <span className={cn(
                    "text-lg font-bold",
                    getScoreColor(item.performanceScore)
                  )}>
                    {item.performanceScore.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
