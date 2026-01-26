"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Package, 
  GraduationCap, 
  Users2, 
  Video,
  ArrowRight,
  Clock,
  Building2
} from "lucide-react";
import { formatDateShort, getDaysUntil, getCadenceLabel, calculateNextOccurrences } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UpcomingDeliverable {
  id: string;
  type: "delivery" | "workshop" | "hotseat" | "meeting";
  title: string;
  date: string;
  nextDate: string | null;
  cadence: string | null;
  companyId: string;
  companyName: string;
  csOwnerId: string | null;
}

interface UpcomingDeliverablesProps {
  csOwnerId?: string;
  companyId?: string;
  days?: number;
  maxItems?: number;
  showCompany?: boolean;
  showFutureOccurrences?: boolean;
  title?: string;
  className?: string;
}

const typeConfig = {
  delivery: {
    icon: Package,
    label: "Entrega",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  workshop: {
    icon: GraduationCap,
    label: "Workshop",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  hotseat: {
    icon: Users2,
    label: "Hotseat",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  meeting: {
    icon: Video,
    label: "Reunião",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
};

export function UpcomingDeliverables({
  csOwnerId,
  companyId,
  days = 30,
  maxItems = 10,
  showCompany = true,
  showFutureOccurrences = true,
  title = "Próximas Entregas",
  className,
}: UpcomingDeliverablesProps) {
  const [deliverables, setDeliverables] = useState<UpcomingDeliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeliverables() {
      try {
        const params = new URLSearchParams();
        if (csOwnerId) params.set("csOwnerId", csOwnerId);
        if (companyId) params.set("companyId", companyId);
        params.set("days", days.toString());

        const response = await fetch(`/api/upcoming-deliverables?${params}`);
        if (response.ok) {
          const data = await response.json();
          setDeliverables(data.slice(0, maxItems));
        }
      } catch (error) {
        console.error("Erro ao carregar entregas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeliverables();
  }, [csOwnerId, companyId, days, maxItems]);

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return "text-destructive";
    if (daysUntil <= 2) return "text-amber-600";
    if (daysUntil <= 7) return "text-blue-600";
    return "text-muted-foreground";
  };

  const getUrgencyLabel = (daysUntil: number) => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)}d atrasado`;
    if (daysUntil === 0) return "Hoje";
    if (daysUntil === 1) return "Amanhã";
    return `em ${daysUntil}d`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deliverables.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma entrega programada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {deliverables.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {deliverables.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              const daysUntil = getDaysUntil(item.date);
              const isExpanded = expandedItem === item.id;
              const futureOccurrences = item.cadence && showFutureOccurrences
                ? calculateNextOccurrences(item.date, item.cadence, 3)
                : [];

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "rounded-lg border p-3 transition-all cursor-pointer hover:bg-muted/50",
                    isExpanded && "bg-muted/30"
                  )}
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {item.title}
                        </span>
                        <Badge variant="outline" className={cn("text-xs shrink-0", config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(item.date)}
                        </span>
                        
                        <span className={cn("flex items-center gap-1 font-medium", getUrgencyColor(daysUntil))}>
                          <Clock className="h-3 w-3" />
                          {getUrgencyLabel(daysUntil)}
                        </span>
                        
                        {item.cadence && (
                          <Badge variant="secondary" className="text-xs">
                            {getCadenceLabel(item.cadence)}
                          </Badge>
                        )}
                      </div>
                      
                      {showCompany && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {item.companyName}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && futureOccurrences.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Próximas ocorrências previstas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {futureOccurrences.map((date, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                          >
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {formatDateShort(date)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
