"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, Mail, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationPreferences {
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyDeliveries: boolean;
  notifyProgress: boolean;
  notifyDeadlines: boolean;
  notifyWeeklySummary: boolean;
}

type DeliveryChannel = "app_only" | "app_and_email";

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyInApp: true,
    notifyEmail: true,
    notifyDeliveries: true,
    notifyProgress: true,
    notifyDeadlines: true,
    notifyWeeklySummary: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const deliveryChannel: DeliveryChannel = preferences.notifyEmail ? "app_and_email" : "app_only";

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/user/notification-preferences");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error("Erro ao carregar preferências:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    setSaving(key);
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        setPreferences(preferences);
      }
    } catch {
      setPreferences(preferences);
    } finally {
      setSaving(null);
    }
  };

  const setDeliveryChannel = async (channel: DeliveryChannel) => {
    const notifyEmail = channel === "app_and_email";
    setSaving("channel");
    const newPreferences = { ...preferences, notifyEmail, notifyInApp: true };
    setPreferences(newPreferences);

    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyEmail, notifyInApp: true }),
      });

      if (!response.ok) {
        setPreferences(preferences);
      }
    } catch {
      setPreferences(preferences);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificações</CardTitle>
          <CardDescription>Carregando preferências...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notificações
        </CardTitle>
        <CardDescription>
          Escolha como e quando deseja ser notificado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium">Como você quer receber notificações?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChannelCard
              icon={Monitor}
              title="Apenas no sistema"
              description="Notificações aparecem somente no painel"
              isSelected={deliveryChannel === "app_only"}
              disabled={saving === "channel"}
              onClick={() => setDeliveryChannel("app_only")}
            />
            <ChannelCard
              icon={Mail}
              title="Sistema + Email"
              description="Receba também por email para não perder nada"
              isSelected={deliveryChannel === "app_and_email"}
              disabled={saving === "channel"}
              onClick={() => setDeliveryChannel("app_and_email")}
            />
          </div>
          {deliveryChannel === "app_and_email" && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <Mail className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Você receberá emails para notificações importantes. Pode cancelar a qualquer momento clicando no link dentro do email.
              </span>
            </p>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">O que você quer ser notificado?</p>
          <ToggleOption
            label="Entregas"
            description="Novas entregas, conclusões e aprovações"
            checked={preferences.notifyDeliveries}
            disabled={saving === "notifyDeliveries"}
            onChange={(value) => updatePreference("notifyDeliveries", value)}
          />
          <ToggleOption
            label="Atualizações de progresso"
            description="Quando o progresso de uma entrega é atualizado"
            checked={preferences.notifyProgress}
            disabled={saving === "notifyProgress"}
            onChange={(value) => updatePreference("notifyProgress", value)}
          />
          <ToggleOption
            label="Lembretes de prazos"
            description="Pendências atrasadas e prazos próximos"
            checked={preferences.notifyDeadlines}
            disabled={saving === "notifyDeadlines"}
            onChange={(value) => updatePreference("notifyDeadlines", value)}
          />
        </div>

        {deliveryChannel === "app_and_email" && (
          <div className="border-t pt-6 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Emails adicionais</p>
            <ToggleOption
              label="Resumo semanal"
              description="Receba toda segunda-feira um resumo das atividades da semana"
              checked={preferences.notifyWeeklySummary}
              disabled={saving === "notifyWeeklySummary"}
              onChange={(value) => updatePreference("notifyWeeklySummary", value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  description,
  isSelected,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-muted bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/20",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={cn("font-medium text-sm", isSelected && "text-primary")}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors shrink-0",
          checked ? "bg-primary" : "bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
