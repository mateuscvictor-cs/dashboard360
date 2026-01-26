"use client";

import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Phone, Mail, Calendar, AlertTriangle, ExternalLink, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Account } from "@/types";
import { formatCurrency, formatRelativeTime, getHealthLabel, cn } from "@/lib/utils";

interface AccountHeaderProps {
  account: Account;
}

const healthGradients = {
  critical: "from-red-500 to-rose-600",
  risk: "from-orange-500 to-amber-500",
  attention: "from-amber-500 to-yellow-500",
  healthy: "from-emerald-500 to-teal-500",
} as const;

export function AccountHeader({ account }: AccountHeaderProps) {
  return (
    <div className="border-b bg-gradient-to-r from-background via-background to-muted/30">
      <div className="flex items-center gap-4 px-6 py-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-background shadow-lg">
            <AvatarFallback className={cn(
              "text-lg font-bold text-white bg-gradient-to-br",
              healthGradients[account.healthStatus]
            )}>
              {account.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background",
            account.healthStatus === "healthy" && "bg-health-healthy",
            account.healthStatus === "attention" && "bg-health-attention",
            account.healthStatus === "risk" && "bg-health-risk",
            account.healthStatus === "critical" && "bg-health-critical"
          )} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{account.name}</h1>
            <Badge variant={`${account.healthStatus}-soft`} size="lg" dot pulse={account.healthStatus === "critical"}>
              {getHealthLabel(account.healthScore)}
            </Badge>
            {account.riskScore > 70 && (
              <Badge variant="danger" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Risco Alto
              </Badge>
            )}
            {account.expansionScore > 80 && (
              <Badge variant="success" className="gap-1">
                <Shield className="h-3 w-3" />
                Expansão
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="font-medium">{account.segment}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{account.plan}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="font-semibold text-foreground">{formatCurrency(account.mrr)}/mês</span>
            <span className="text-muted-foreground/50">•</span>
            <span>CS: {account.csOwner}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Phone className="h-4 w-4" />
            Ligar
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Mail className="h-4 w-4" />
            Email
          </Button>
          <Button variant="default" size="sm" className="gap-2 rounded-xl">
            <Calendar className="h-4 w-4" />
            Agendar
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-6 pb-4">
        <MetricCard 
          label="Health Score" 
          value={account.healthScore} 
          suffix="%" 
          status={account.healthStatus}
          gradient={healthGradients[account.healthStatus]}
        />
        <MetricCard 
          label="Risco de Churn" 
          value={account.riskScore} 
          suffix="%" 
          warning={account.riskScore > 50}
          gradient="from-red-500 to-orange-500"
        />
        <MetricCard 
          label="Expansão" 
          value={account.expansionScore} 
          suffix="%" 
          highlight={account.expansionScore > 70}
          gradient="from-emerald-500 to-cyan-500"
        />
        <MetricCard 
          label="Adoção" 
          value={account.adoptionScore} 
          suffix="%"
          gradient="from-blue-500 to-indigo-500"
        />
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Última interação</p>
            <p className="text-sm font-semibold">{formatRelativeTime(account.lastInteraction)}</p>
          </div>
          {account.nextDelivery && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Próxima entrega</p>
              <p className="text-sm font-semibold">
                {new Date(account.nextDelivery).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix = "",
  status,
  warning,
  highlight,
  gradient,
}: {
  label: string;
  value: number;
  suffix?: string;
  status?: string;
  warning?: boolean;
  highlight?: boolean;
  gradient: string;
}) {
  const showGradient = status || warning || highlight;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 min-w-[100px] group hover:shadow-md transition-shadow">
      {showGradient && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
          gradient
        )} />
      )}
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium relative">{label}</p>
      <div className="flex items-baseline gap-0.5 relative">
        <span className={cn(
          "text-2xl font-bold",
          showGradient && "bg-gradient-to-r bg-clip-text text-transparent",
          showGradient && gradient
        )}>
          {value}
        </span>
        <span className="text-sm text-muted-foreground font-medium">{suffix}</span>
      </div>
    </div>
  );
}
