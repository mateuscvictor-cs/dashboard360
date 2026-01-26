"use client";

import { Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Squad } from "@/types";
import { cn } from "@/lib/utils";

interface SquadsOverviewProps {
  squads: Squad[];
}

export function SquadsOverview({ squads }: SquadsOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Squads</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {squads.map((squad) => {
          const loadPercentage = (squad.currentLoad / squad.capacity) * 100;
          const isOverloaded = loadPercentage > 85;
          const isBusy = loadPercentage > 70;

          return (
            <div key={squad.id} className="group rounded-xl border p-3 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{squad.name}</span>
                  {isOverloaded && (
                    <Badge variant="danger-soft" size="sm" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Sobrecarregado
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {squad.accountsCount} contas
                </span>
              </div>
              
              <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    isOverloaded 
                      ? "bg-gradient-to-r from-red-500 to-rose-500" 
                      : isBusy 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  )}
                  style={{ width: `${loadPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-lg font-bold",
                    isOverloaded ? "text-health-critical" : isBusy ? "text-health-attention" : "text-health-healthy"
                  )}>
                    {Math.round(loadPercentage)}%
                  </span>
                  <span className="text-xs text-muted-foreground">capacidade</span>
                </div>
                {squad.blockedItems > 0 && (
                  <Badge variant="risk-soft" size="sm">
                    {squad.blockedItems} bloqueios
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground group">
          Gerenciar squads
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
