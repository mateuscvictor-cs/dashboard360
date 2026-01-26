"use client";

import { FileText, ExternalLink, Download, Video, BookOpen, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const resources = [
  {
    category: "Documentação",
    items: [
      { title: "Guia de Integração API", type: "documentation", icon: FileText },
      { title: "Manual do Usuário", type: "guide", icon: BookOpen },
      { title: "Referência Técnica", type: "documentation", icon: FileText },
    ],
  },
  {
    category: "Tutoriais",
    items: [
      { title: "Vídeos Tutoriais", type: "video", icon: Video },
      { title: "Webinars Gravados", type: "video", icon: Video },
    ],
  },
  {
    category: "Suporte",
    items: [
      { title: "FAQ", type: "faq", icon: HelpCircle },
      { title: "Base de Conhecimento", type: "documentation", icon: BookOpen },
    ],
  },
];

export default function DocumentacaoPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Documentação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recursos e materiais para ajudar você a aproveitar ao máximo a plataforma
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          {resources.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.items.map((item, itemIndex) => (
                    <Button
                      key={itemIndex}
                      variant="outline"
                      className="w-full justify-between h-auto p-4 rounded-xl hover:shadow-md transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-primary" />
                        <span className="text-left">{item.title}</span>
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
