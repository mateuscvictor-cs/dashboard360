"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Link as LinkIcon,
  FileText,
  Video,
  ExternalLink,
  Bot,
  Sparkles,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClienteHeader } from "@/components/layout/cliente-header";
import { cn } from "@/lib/utils";

type ClientResource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: "AUTOMATION" | "IPC" | "LINK" | "DOCUMENT" | "VIDEO";
  category: string | null;
  icon: string | null;
};

type GroupedResources = {
  automations: ClientResource[];
  ipcs: ClientResource[];
  links: ClientResource[];
  documents: ClientResource[];
  videos: ClientResource[];
};

const typeConfig = {
  AUTOMATION: { label: "Automações", icon: Bot, color: "from-purple-500 to-indigo-500" },
  IPC: { label: "IPCs", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  LINK: { label: "Links Úteis", icon: LinkIcon, color: "from-blue-500 to-cyan-500" },
  DOCUMENT: { label: "Documentos", icon: FileText, color: "from-emerald-500 to-teal-500" },
  VIDEO: { label: "Vídeos", icon: Video, color: "from-pink-500 to-rose-500" },
};

export default function RecursosPage() {
  const [resources, setResources] = useState<GroupedResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchResources() {
      try {
        const response = await fetch("/api/client-resources");
        if (response.ok) {
          const data: ClientResource[] = await response.json();

          const grouped: GroupedResources = {
            automations: data.filter((r) => r.type === "AUTOMATION"),
            ipcs: data.filter((r) => r.type === "IPC"),
            links: data.filter((r) => r.type === "LINK"),
            documents: data.filter((r) => r.type === "DOCUMENT"),
            videos: data.filter((r) => r.type === "VIDEO"),
          };

          setResources(grouped);
        }
      } catch (error) {
        console.error("Erro ao buscar recursos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  const totalResources = resources
    ? resources.automations.length +
      resources.ipcs.length +
      resources.links.length +
      resources.documents.length +
      resources.videos.length
    : 0;

  const allResources = resources
    ? [
        ...resources.automations,
        ...resources.ipcs,
        ...resources.links,
        ...resources.documents,
        ...resources.videos,
      ]
    : [];

  const getFilteredResources = () => {
    if (!resources) return [];
    switch (activeTab) {
      case "automations":
        return resources.automations;
      case "ipcs":
        return resources.ipcs;
      case "links":
        return resources.links;
      case "documents":
        return resources.documents;
      case "videos":
        return resources.videos;
      default:
        return allResources;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ClienteHeader title="Recursos" subtitle="Automações, IPCs e links úteis" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {totalResources === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                Nenhum recurso disponível
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Os recursos serão adicionados pelo seu CS Owner em breve.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(typeConfig).map(([type, config]) => {
                const count =
                  resources?.[
                    type === "AUTOMATION"
                      ? "automations"
                      : type === "IPC"
                        ? "ipcs"
                        : type === "LINK"
                          ? "links"
                          : type === "DOCUMENT"
                            ? "documents"
                            : "videos"
                  ]?.length || 0;

                return (
                  <Card key={type} className="cursor-pointer hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br mb-3",
                          config.color
                        )}
                      >
                        <config.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todos ({totalResources})</TabsTrigger>
                {resources?.automations.length ? (
                  <TabsTrigger value="automations">
                    Automações ({resources.automations.length})
                  </TabsTrigger>
                ) : null}
                {resources?.ipcs.length ? (
                  <TabsTrigger value="ipcs">IPCs ({resources.ipcs.length})</TabsTrigger>
                ) : null}
                {resources?.links.length ? (
                  <TabsTrigger value="links">Links ({resources.links.length})</TabsTrigger>
                ) : null}
                {resources?.documents.length ? (
                  <TabsTrigger value="documents">
                    Documentos ({resources.documents.length})
                  </TabsTrigger>
                ) : null}
                {resources?.videos.length ? (
                  <TabsTrigger value="videos">Vídeos ({resources.videos.length})</TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredResources().map((resource, index) => (
                    <ResourceCard key={resource.id} resource={resource} index={index} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ resource, index }: { resource: ClientResource; index: number }) {
  const config = typeConfig[resource.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-lg transition-all group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br",
                config.color
              )}
            >
              <config.icon className="h-5 w-5 text-white" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
          </div>
          <CardTitle className="text-base mt-3">{resource.title}</CardTitle>
          {resource.description && (
            <CardDescription className="text-sm line-clamp-2">
              {resource.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {resource.category && (
            <p className="text-xs text-muted-foreground mb-3">Categoria: {resource.category}</p>
          )}
          {resource.url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              onClick={() => window.open(resource.url!, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              {resource.type === "AUTOMATION" ? "Abrir Automação" : "Acessar"}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
