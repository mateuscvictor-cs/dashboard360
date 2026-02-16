"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Save,
  Eye,
  RotateCcw,
  ChevronLeft,
  Loader2,
  Check,
  X,
  Code,
  FileText,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type EmailTemplateType =
  | "NOTIFICATION"
  | "INVITE"
  | "WELCOME"
  | "PASSWORD_RESET"
  | "SURVEY_REQUEST"
  | "DELIVERY_COMPLETED"
  | "DEPENDENCY_REMINDER"
  | "WEEKLY_SUMMARY";

interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
}

const templateTypeLabels: Record<EmailTemplateType, { label: string; description: string }> = {
  NOTIFICATION: { label: "Notificação", description: "E-mails de notificação geral" },
  INVITE: { label: "Convite", description: "Convites para novos usuários" },
  WELCOME: { label: "Boas-vindas", description: "E-mail de boas-vindas" },
  PASSWORD_RESET: { label: "Reset de Senha", description: "Recuperação de senha" },
  SURVEY_REQUEST: { label: "Pesquisa", description: "Solicitação de pesquisa" },
  DELIVERY_COMPLETED: { label: "Entrega Concluída", description: "Notificação de entrega" },
  DEPENDENCY_REMINDER: { label: "Lembrete de Pendência", description: "Lembrete de pendências" },
  WEEKLY_SUMMARY: { label: "Resumo Semanal", description: "Resumo semanal" },
};

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedHtml, setEditedHtml] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Erro ao buscar templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSeedTemplates = async () => {
    setSeeding(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/email-templates/seed", {
        method: "POST",
      });
      if (response.ok) {
        await fetchTemplates();
        setSuccess("Templates padrão criados com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Erro ao criar templates padrão");
    } finally {
      setSeeding(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedHtml(template.htmlContent);
    setShowPreview(false);
    setPreview(null);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editedSubject,
          htmlContent: editedHtml,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        setSelectedTemplate(updated);
        setSuccess("Template salvo com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (err) {
      setError("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;

    try {
      const sampleVariables: Record<string, string> = {};
      selectedTemplate.variables.forEach((v) => {
        sampleVariables[v] = `[${v}]`;
      });
      sampleVariables.recipientName = " João";
      sampleVariables.appUrl = "https://app.vanguardia.com";

      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: sampleVariables }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
        setShowPreview(true);
      }
    } catch (err) {
      setError("Erro ao gerar preview");
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        if (selectedTemplate?.id === updated.id) {
          setSelectedTemplate(updated);
        }
      }
    } catch (err) {
      setError("Erro ao atualizar status");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Templates de E-mail" showFilters={false} />

      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="h-full flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/configuracoes")}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>

            {templates.length === 0 && !loading && (
              <Button onClick={handleSeedTemplates} disabled={seeding} className="gap-2">
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Criar Templates Padrão
              </Button>
            )}
          </div>

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              {success}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Nenhum template configurado</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique em &quot;Criar Templates Padrão&quot; para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
              <div className="col-span-4 overflow-auto">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Templates</CardTitle>
                    <CardDescription>Selecione para editar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {templates.map((template) => {
                      const typeInfo = templateTypeLabels[template.type];
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            selectedTemplate?.id === template.id
                              ? "border-primary bg-primary/5"
                              : "border-transparent bg-muted/50 hover:bg-muted"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{template.name}</p>
                              <p className="text-xs text-muted-foreground">{typeInfo?.description}</p>
                            </div>
                            <Badge
                              variant={template.isActive ? "success-soft" : "secondary"}
                              className="shrink-0"
                            >
                              {template.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-8 overflow-hidden">
                {selectedTemplate ? (
                  <Card className="h-full flex flex-col">
                    <CardHeader className="pb-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{selectedTemplate.name}</CardTitle>
                          <CardDescription>
                            Variáveis: {selectedTemplate.variables.map((v) => `{{${v}}}`).join(", ")}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(selectedTemplate)}
                          >
                            {selectedTemplate.isActive ? "Desativar" : "Ativar"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1">
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Assunto</label>
                        <Input
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          placeholder="Assunto do e-mail"
                        />
                      </div>

                      <Tabs defaultValue="code" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="shrink-0">
                          <TabsTrigger value="code" className="gap-1">
                            <Code className="h-3.5 w-3.5" />
                            HTML
                          </TabsTrigger>
                          <TabsTrigger value="preview" className="gap-1" onClick={handlePreview}>
                            <FileText className="h-3.5 w-3.5" />
                            Visualização
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="code" className="flex-1 min-h-0 mt-2">
                          <textarea
                            value={editedHtml}
                            onChange={(e) => setEditedHtml(e.target.value)}
                            className="w-full h-full min-h-[300px] p-4 rounded-lg border bg-muted/50 font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="HTML do template..."
                          />
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 min-h-0 mt-2">
                          {preview ? (
                            <div className="h-full overflow-auto border rounded-lg bg-white">
                              <iframe
                                srcDoc={preview.html}
                                className="w-full h-full min-h-[300px]"
                                title="Preview"
                              />
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center border rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">
                                Clique em &quot;Preview&quot; para visualizar
                              </p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Selecione um template para editar
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
