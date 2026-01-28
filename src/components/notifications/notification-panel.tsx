"use client";

import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "./notification-provider";
import { NotificationItem } from "./notification-item";

interface NotificationPanelProps {
  onClose?: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const grouped = {
    today: notifications.filter((n) => new Date(n.createdAt) >= today),
    yesterday: notifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= yesterday && date < today;
    }),
    thisWeek: notifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= weekAgo && date < yesterday;
    }),
    older: notifications.filter((n) => new Date(n.createdAt) < weekAgo),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhuma notificação</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Você verá as novidades aqui
        </p>
      </div>
    );
  }

  const renderGroup = (title: string, items: typeof notifications) => {
    if (items.length === 0) return null;

    return (
      <div key={title}>
        <p className="text-xs font-medium text-muted-foreground px-3 py-2">
          {title}
        </p>
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            onClose={onClose}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">Notificações</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={markAllAsRead}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {renderGroup("Hoje", grouped.today)}
          {renderGroup("Ontem", grouped.yesterday)}
          {renderGroup("Esta semana", grouped.thisWeek)}
          {renderGroup("Anteriores", grouped.older)}
        </div>
      </ScrollArea>
    </div>
  );
}
