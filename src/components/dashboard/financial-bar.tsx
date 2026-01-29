"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Wallet, TrendingUp, Target, ArrowRight, CircleDollarSign, Receipt, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialBarProps {
  billedAmount: number;
  cashIn: number;
}

export function FinancialBar({ billedAmount, cashIn }: FinancialBarProps) {
  const percentage = billedAmount > 0 ? (cashIn / billedAmount) * 100 : 0;
  const pending = billedAmount - cashIn;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusConfig = () => {
    if (percentage >= 80) return { 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      gradient: "from-emerald-500 to-teal-500",
      label: "Excelente",
      icon: "🎯"
    };
    if (percentage >= 60) return { 
      color: "text-amber-500", 
      bg: "bg-amber-500/10",
      gradient: "from-amber-500 to-yellow-500",
      label: "Bom",
      icon: "📈"
    };
    return { 
      color: "text-red-500", 
      bg: "bg-red-500/10",
      gradient: "from-red-500 to-rose-500",
      label: "Atenção",
      icon: "⚠️"
    };
  };

  const status = getStatusConfig();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <CircleDollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Financeiro</CardTitle>
              <p className="text-xs text-muted-foreground">Faturamento vs Recebimento</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn("gap-1", status.bg, status.color)}>
            <span>{status.icon}</span>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-200/50 dark:border-violet-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Faturado</p>
              <p className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                {formatCurrency(billedAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200/50 dark:border-emerald-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Cash In</p>
              <p className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {formatCurrency(cashIn)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-200/50 dark:border-amber-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">A Receber</p>
              <p className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {formatCurrency(pending)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed" 
            style={{ borderColor: percentage >= 80 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444" }}>
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg bg-gradient-to-br",
              status.gradient
            )}>
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Conversão</p>
              <p className={cn("text-2xl font-bold", status.color)}>
                {percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Progresso de Recebimento</span>
            <span className="text-xs font-medium">{formatCurrencyFull(cashIn)} de {formatCurrencyFull(billedAmount)}</span>
          </div>
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            {percentage < 100 && (
              <div 
                className="absolute inset-y-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-r-full"
                style={{ 
                  left: `${Math.min(percentage, 100)}%`,
                  width: `${Math.max(0, 100 - percentage)}%`
                }}
              />
            )}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ left: `${Math.min(percentage, 100)}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              <span className="text-[11px] text-muted-foreground">Recebido ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
              <span className="text-[11px] text-muted-foreground">Pendente ({(100 - percentage).toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className={cn("h-5 w-5", status.color)} />
            <div>
              <p className="text-xs text-muted-foreground">Status da Meta</p>
              <p className={cn("text-sm font-bold", status.color)}>
                {percentage >= 80 ? "Meta atingida!" : percentage >= 60 ? "Quase lá" : "Precisa de atenção"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Para atingir 80%</p>
            <p className="text-sm font-bold">
              {percentage >= 80 ? (
                <span className="text-emerald-500">Concluído ✓</span>
              ) : (
                <span className="text-amber-500">
                  Faltam {formatCurrency(Math.max(0, (billedAmount * 0.8) - cashIn))}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
