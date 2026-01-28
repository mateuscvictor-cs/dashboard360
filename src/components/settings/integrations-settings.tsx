"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type FathomStatus = {
  configured: boolean;
  isActive?: boolean;
  maskedKey?: string;
  createdAt?: string;
  error?: string;
};

export function IntegrationsSettings() {
  const [fathomStatus, setFathomStatus] = useState<FathomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadFathomStatus();
  }, []);

  const loadFathomStatus = async () => {
    try {
      const res = await fetch("/api/user/integrations/fathom");
      const data = await res.json();
      setFathomStatus(data);
    } catch {
      setError("Erro ao carregar status");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("API key é obrigatória");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/integrations/fathom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao salvar");
        return;
      }

      setFathomStatus({
        configured: true,
        isActive: true,
        maskedKey: data.maskedKey,
        createdAt: data.createdAt,
      });
      setApiKey("");
      setSuccess("Fathom configurado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover a integração com o Fathom?")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/user/integrations/fathom", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao remover");
      }

      setFathomStatus({ configured: false });
      setSuccess("Integração removida");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao remover integração");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrações</CardTitle>
        <CardDescription>
          Conecte serviços externos para expandir funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-purple-600"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Fathom</h3>
                <p className="text-sm text-muted-foreground">
                  Transcrição e resumo de reuniões
                </p>
              </div>
            </div>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : fathomStatus?.configured ? (
              <Badge
                variant={fathomStatus.isActive ? "default" : "secondary"}
                className="gap-1"
              >
                {fathomStatus.isActive ? (
                  <>
                    <Check className="h-3 w-3" /> Conectado
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" /> Inativo
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="outline">Não configurado</Badge>
            )}
          </div>

          {!loading && (
            <>
              {fathomStatus?.configured ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">API Key:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {fathomStatus.maskedKey}
                    </code>
                  </div>
                  {fathomStatus.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Configurado em:{" "}
                      {new Date(fathomStatus.createdAt).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Obtenha sua API key em{" "}
                    <a
                      href="https://fathom.video/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      fathom.video/settings
                    </a>{" "}
                    na seção &quot;API Access&quot;.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua API key aqui"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Conectar"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
