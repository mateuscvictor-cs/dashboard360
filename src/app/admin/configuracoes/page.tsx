"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Monitor, Mail, ChevronRight, User, Lock, Bell, Palette, Plug } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings, PasswordSettings } from "@/components/settings/profile-settings";
import { IntegrationsSettings } from "@/components/settings/integrations-settings";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export default function ConfiguracoesPage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Configurações" showFilters={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              E-mails
            </TabsTrigger>
          </TabsList>

          <div className="max-w-3xl">
            <TabsContent value="profile" className="mt-0">
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <PasswordSettings />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationPreferences />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Tema</CardTitle>
                  <CardDescription>Escolha como o painel será exibido</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <ThemeOption
                      icon={Sun}
                      label="Claro"
                      description="Fundo claro"
                      isActive={theme === "light"}
                      onClick={() => handleThemeChange("light")}
                    />
                    <ThemeOption
                      icon={Moon}
                      label="Escuro"
                      description="Fundo escuro"
                      isActive={theme === "dark"}
                      onClick={() => handleThemeChange("dark")}
                    />
                    <ThemeOption
                      icon={Monitor}
                      label="Sistema"
                      description="Automático"
                      isActive={theme === "system"}
                      onClick={() => handleThemeChange("system")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-0">
              <IntegrationsSettings />
            </TabsContent>

            <TabsContent value="emails" className="mt-0">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Templates de E-mail</CardTitle>
                  <CardDescription>
                    Personalize o visual e conteúdo dos e-mails automáticos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Edite os templates HTML dos e-mails enviados pela plataforma, 
                    como notificações, convites e lembretes.
                  </p>
                  <Link href="/admin/configuracoes/email-templates">
                    <Button className="gap-2">
                      <Mail className="h-4 w-4" />
                      Gerenciar Templates
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  description,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center",
        isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
