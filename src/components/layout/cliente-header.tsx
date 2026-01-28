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
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {showNotifications && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}
