"use client";

import { Users, Mail, MessageSquare, Phone, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClienteHeader } from "@/components/layout/cliente-header";

const supportContacts = [
  {
    name: "Carlos Silva",
    role: "CS Care Lead",
    email: "carlos@vanguardia.com",
    phone: "+55 11 99999-9999",
    availability: "Disponível",
    responseTime: "Responde em até 2h",
  },
  {
    name: "Ana Rodrigues",
    role: "Technical Lead",
    email: "ana@vanguardia.com",
    phone: "+55 11 88888-8888",
    availability: "Disponível",
    responseTime: "Responde em até 4h",
  },
];

export default function SuportePage() {
  return (
    <div className="flex flex-col h-full">
      <ClienteHeader title="Suporte" subtitle="Entre em contato com nossa equipe de suporte" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contatos de Suporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportContacts.map((contact, index) => (
                <div
                  key={index}
                  className="rounded-xl border p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.role}</p>
                    </div>
                    <Badge variant="success-soft" className="gap-1">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      {contact.availability}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {contact.responseTime}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 flex-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 flex-1">
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 flex-1">
                      <Phone className="h-4 w-4" />
                      Ligar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Chamado</CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full gap-2">
                <MessageSquare className="h-4 w-4" />
                Abrir novo chamado de suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
