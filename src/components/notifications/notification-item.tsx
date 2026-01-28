"use client";

import Link from "next/link";
import {
  Bell,
  Package,
  MessageSquare,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  Key,
  Megaphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type Notification } from "./notification-provider";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  DEPENDENCY_ADDED: { icon: Key, color: "text-blue-500" },
  DEPENDENCY_OVERDUE: { icon: AlertTriangle, color: "text-red-500" },
  DELIVERY_PROGRESS: { icon: Package, color: "text-cyan-500" },
  DELIVERY_COMPLETED: { icon: CheckCircle, color: "text-green-500" },
  COMMENT_RESPONSE: { icon: MessageSquare, color: "text-purple-500" },
  MEETING_SCHEDULED: { icon: Calendar, color: "text-orange-500" },
  SURVEY_PENDING: { icon: ClipboardCheck, color: "text-yellow-500" },
  DEPENDENCY_PROVIDED: { icon: Key, color: "text-green-500" },
  CLIENT_COMMENT: { icon: MessageSquare, color: "text-blue-500" },
  DELIVERY_APPROVED: { icon: CheckCircle, color: "text-green-500" },
  SURVEY_COMPLETED: { icon: ClipboardCheck, color: "text-green-500" },
  LOW_SCORE_ALERT: { icon: AlertTriangle, color: "text-red-500" },
  MANUAL_MESSAGE: { icon: Bell, color: "text-indigo-500" },
  BROADCAST: { icon: Megaphone, color: "text-violet-500" },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const config = typeConfig[notification.type] || { icon: Bell, color: "text-gray-500" };
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (onClose) {
      onClose();
    }
  };

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer group",
        notification.isRead
          ? "bg-transparent hover:bg-muted/50"
          : "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          notification.isRead ? "bg-muted" : "bg-primary/10"
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm line-clamp-1",
              notification.isRead ? "font-normal" : "font-semibold"
            )}
          >
            {notification.title}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}
