"use client";

import { Crown, UserCheck, UserX, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Contact } from "@/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface ContactsMapProps {
  contacts: Contact[];
}

const engagementConfig = {
  high: { label: "Ativo", icon: UserCheck, color: "text-health-healthy", bg: "bg-health-healthy/10" },
  medium: { label: "Moderado", icon: Clock, color: "text-health-attention", bg: "bg-health-attention/10" },
  low: { label: "Baixo", icon: Clock, color: "text-health-risk", bg: "bg-health-risk/10" },
  inactive: { label: "Inativo", icon: UserX, color: "text-muted-foreground", bg: "bg-muted" },
};

export function ContactsMap({ contacts }: ContactsMapProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <UserX className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contacts.map((contact) => {
        const engagement = engagementConfig[contact.engagementLevel];
        const EngagementIcon = engagement.icon;

        return (
          <div
            key={contact.id}
            className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className={cn(engagement.bg, engagement.color)}>
                {contact.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{contact.name}</p>
                {contact.isDecisionMaker && (
                  <Crown className="h-4 w-4 text-warning shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{contact.role}</p>
              <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
              {contact.phone && (
                <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className={cn("gap-1", engagement.color)}>
                  <EngagementIcon className="h-3 w-3" />
                  {engagement.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Último contato: {formatRelativeTime(contact.lastContact)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
