"use client";

import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClienteHeader } from "@/components/layout/cliente-header";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotifications, type Notification } from "@/components/notifications/notification-provider";

export default function ClienteNotificacoesPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const grouped = {
    today: filteredNotifications.filter((n) => new Date(n.createdAt) >= today),
    yesterday: filteredNotifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= yesterday && date < today;
    }),
    thisWeek: filteredNotifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= weekAgo && date < yesterday;
    }),
    older: filteredNotifications.filter((n) => new Date(n.createdAt) < weekAgo),
  };

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title} className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((notification) => (
            <Card key={notification.id} className="overflow-hidden">
              <CardContent className="p-0">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ClienteHeader
        title="Notificações"
        subtitle={unreadCount > 0 ? `${unreadCount} não lida(s)` : "Todas lidas"}
        showNotifications={false}
      >
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas
          </Button>
        )}
      </ClienteHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Não lidas ({unreadCount})
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">
                {filter === "unread"
                  ? "Nenhuma notificação não lida"
                  : "Nenhuma notificação"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "unread"
                  ? "Você está em dia com suas notificações!"
                  : "Você verá as novidades aqui"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {renderGroup("Hoje", grouped.today)}
              {renderGroup("Ontem", grouped.yesterday)}
              {renderGroup("Esta semana", grouped.thisWeek)}
              {renderGroup("Anteriores", grouped.older)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
