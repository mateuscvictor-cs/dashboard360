"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileSettings, PasswordSettings } from "@/components/settings/profile-settings";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

export default function ClienteConfiguracoesPage() {
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
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize suas preferências
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <ProfileSettings />

          <PasswordSettings />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do painel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <ThemeButton
                  icon={Sun}
                  label="Claro"
                  isActive={theme === "light"}
                  onClick={() => handleThemeChange("light")}
                />
                <ThemeButton
                  icon={Moon}
                  label="Escuro"
                  isActive={theme === "dark"}
                  onClick={() => handleThemeChange("dark")}
                />
                <ThemeButton
                  icon={Monitor}
                  label="Sistema"
                  isActive={theme === "system"}
                  onClick={() => handleThemeChange("system")}
                />
              </div>
            </CardContent>
          </Card>

          <NotificationPreferences />
        </div>
      </div>
    </div>
  );
}

function ThemeButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors flex-1",
        isActive
          ? "border-primary bg-primary/5"
          : "border-transparent bg-muted hover:bg-muted/80"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
