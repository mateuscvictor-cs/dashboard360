"use client";

import { Search, Filter, Command, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications";

interface HeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  showFilters?: boolean;
  alertCount?: number;
  backLink?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, showFilters = true, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {action}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="h-10 w-72 rounded-xl border bg-muted/50 pl-10 pr-12 text-sm outline-none transition-all duration-200 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>

          {showFilters && (
            <Button variant="outline" size="default" className="gap-2 rounded-xl">
              <Filter className="h-4 w-4" />
              Filtros
              <Badge variant="secondary" size="sm" className="ml-1">3</Badge>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative rounded-xl group">
            <div className="absolute inset-0 rounded-xl bg-gradient-brand opacity-0 group-hover:opacity-10 transition-opacity" />
            <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>

          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
