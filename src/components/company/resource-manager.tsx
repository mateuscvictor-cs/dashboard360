"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  Bot,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Video,
  Loader2,
  ExternalLink,
  GripVertical,
  Upload,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { uploadFileToR2 } from "@/lib/upload-to-r2";

type ResourceType = "AUTOMATION" | "IPC" | "LINK" | "DOCUMENT" | "VIDEO";

interface ClientResource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  type: ResourceType;
  category: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
}

interface ResourceManagerProps {
  companyId: string;
}

const typeConfig: Record<ResourceType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  AUTOMATION: { label: "Automação", icon: Bot, color: "from-purple-500 to-indigo-500" },
  IPC: { label: "IPC", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  LINK: { label: "Link", icon: LinkIcon, color: "from-blue-500 to-cyan-500" },
  DOCUMENT: { label: "Documento", icon: FileText, color: "from-emerald-500 to-teal-500" },
  VIDEO: { label: "Vídeo", icon: Video, color: "from-pink-500 to-rose-500" },
};

const resourceTypes: { value: ResourceType; label: string }[] = [
  { value: "AUTOMATION", label: "Automação" },
  { value: "IPC", label: "IPC" },
  { value: "LINK", label: "Link Útil" },
  { value: "DOCUMENT", label: "Documento" },
  { value: "VIDEO", label: "Vídeo" },
];

export function ResourceManager({ companyId }: ResourceManagerProps) {
  const [resources, setResources] = useState<ClientResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ClientResource | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const resourceFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    type: "LINK" as ResourceType,
    category: "",
    isActive: true,
  });

  useEffect(() => {
    fetchResources();
  }, [companyId]);

  const fetchResources = async () => {
    try {
      const response = await fetch(`/api/client-resources?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error("Erro ao buscar recursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingResource(null);
    setForm({
      title: "",
      description: "",
      url: "",
      type: "LINK",
      category: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (resource: ClientResource) => {
    setEditingResource(resource);
    setForm({
      title: resource.title,
      description: resource.description || "",
      url: resource.url || "",
      type: resource.type,
      category: resource.category || "",
      isActive: resource.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);

    try {
      const url = editingResource
        ? `/api/client-resources/${editingResource.id}`
        : "/api/client-resources";
      const method = editingResource ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          companyId: editingResource ? undefined : companyId,
        }),
      });

      if (response.ok) {
        await fetchResources();
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar recurso:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este recurso?")) return;

    setDeleting(id);

    try {
      const response = await fetch(`/api/client-resources/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setResources(resources.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir recurso:", error);
    } finally {
      setDeleting(null);
    }
  };

  const uploadResourceFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const { readUrl } = await uploadFileToR2(file, "resource", companyId);
      setForm((prev) => ({
        ...prev,
        url: readUrl,
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, "") || file.name,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploadingFile(false);
      if (resourceFileInputRef.current) resourceFileInputRef.current.value = "";
    }
  };

  const toggleActive = async (resource: ClientResource) => {
    try {
      const response = await fetch(`/api/client-resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !resource.isActive }),
      });

      if (response.ok) {
        setResources(
          resources.map((r) =>
            r.id === resource.id ? { ...r, isActive: !r.isActive } : r
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar recurso:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Recursos do Cliente</CardTitle>
            </div>
            <Button size="sm" onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Recurso
            </Button>
          </div>
          <CardDescription>
            Automações, IPCs, links úteis e documentos visíveis para o cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum recurso adicionado</p>
              <p className="text-xs mt-1">
                Clique em "Adicionar Recurso" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => {
                const config = typeConfig[resource.type];
                const Icon = config.icon;

                return (
                  <div
                    key={resource.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      !resource.isActive && "opacity-50 bg-muted/30"
                    )}
                  >
                    <div className="cursor-move text-muted-foreground hover:text-foreground">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{resource.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {config.label}
                        </Badge>
                        {!resource.isActive && (
                          <Badge variant="outline" className="text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {resource.url && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            className="h-7 w-7"
                          >
                            <a
                              href={`/api/storage/download?url=${encodeURIComponent(resource.url)}&filename=${encodeURIComponent(resource.title)}`}
                              aria-label="Baixar"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => window.open(resource.url!, "_blank")}
                            className="h-7 w-7"
                            aria-label="Abrir em nova aba"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleActive(resource)}
                        className="h-7 w-7"
                        title={resource.isActive ? "Desativar" : "Ativar"}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            resource.isActive ? "bg-success" : "bg-muted-foreground"
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(resource)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(resource.id)}
                        disabled={deleting === resource.id}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        {deleting === resource.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResource ? "Editar Recurso" : "Novo Recurso"}
            </DialogTitle>
            <DialogDescription>
              {editingResource
                ? "Atualize as informações do recurso"
                : "Adicione um novo recurso para o cliente"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}
                className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {resourceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Título <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: GPT de Vendas"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Descreva o recurso..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="flex-1 h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://... ou envie um arquivo"
                />
                {(form.type === "DOCUMENT" || form.type === "VIDEO") && (
                  <>
                    <input
                      ref={resourceFileInputRef}
                      type="file"
                      className="hidden"
                      accept={form.type === "VIDEO" ? "video/*" : undefined}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadResourceFile(f);
                      }}
                      disabled={uploadingFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => resourceFileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Enviar arquivo</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ex: Vendas, Marketing, Operações..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm">
                Ativo (visível para o cliente)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingResource ? (
                  "Salvar"
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
