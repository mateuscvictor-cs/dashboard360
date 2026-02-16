"use client";

import { NotificationBell } from "@/components/notifications";
import { cn } from "@/lib/utils";

interface ClienteHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  showNotifications?: boolean;
}

export function ClienteHeader({ 
  title, 
  subtitle, 
  children, 
  className,
  showNotifications = true
}: ClienteHeaderProps) {
  return (
    <header className={cn("border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10", className)}>
      <div className="flex h-16 items-center justify-between gap-2 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">{title}</h1>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {children}
          {showNotifications && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}
