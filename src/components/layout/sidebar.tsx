"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Building2,
  Users,
  LogOut,
  Package,
  UserPlus,
  Calendar,
  Bell,
  Shield,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useUserProfile, UserInfo, UserAvatar } from "./user-avatar";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

type NavSection = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
};

const navSections: NavSection[] = [
  {
    id: "menu",
    title: "Menu",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { name: "Visão 360", href: "/admin", icon: LayoutDashboard, color: "from-indigo-500 to-purple-500" },
      { name: "Operação", href: "/admin/operacao", icon: ListTodo, color: "from-emerald-500 to-teal-500" },
      { name: "Performance", href: "/admin/operacao/performance", icon: Trophy, color: "from-amber-500 to-orange-500" },
      { name: "Squads", href: "/admin/squads", icon: Users, color: "from-violet-500 to-purple-500" },
      { name: "Empresas", href: "/admin/empresas", icon: Building2, color: "from-blue-500 to-cyan-500" },
      { name: "Entregas", href: "/admin/entregas", icon: Package, color: "from-rose-500 to-pink-500" },
      { name: "Agenda", href: "/admin/agenda", icon: Calendar, color: "from-teal-500 to-emerald-500" },
      { name: "Insights IA", href: "/admin/insights", icon: Sparkles, color: "from-pink-500 to-rose-500" },
    ],
  },
  {
    id: "admin",
    title: "Administração",
    icon: Shield,
    defaultOpen: false,
    items: [
      { name: "Acessos", href: "/admin/acessos", icon: UserPlus, color: "from-cyan-500 to-blue-500" },
      { name: "Notificações", href: "/admin/notificacoes", icon: Bell, color: "from-rose-500 to-pink-500" },
      { name: "Configurações", href: "/admin/configuracoes", icon: Settings, color: "from-slate-500 to-zinc-500" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const { user } = useUserProfile();

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    navSections.forEach((section) => {
      const hasActiveItem = section.items.some(
        (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
      );
      initial[section.id] = hasActiveItem || section.defaultOpen || false;
    });
    setOpenSections(initial);
  }, []);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300 relative",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo-vanguardia.png"
              alt="Vanguardia"
              width={140}
              height={36}
              className="h-9 w-auto"
            />
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <Image
              src="/logo-vanguardia.png"
              alt="Vanguardia"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "h-7 w-7 text-muted-foreground hover:text-foreground",
            collapsed && "absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 rounded-full border bg-background shadow-md"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="relative flex-1 overflow-y-auto p-3 space-y-2">
        {navSections.map((section) => {
          const isOpen = openSections[section.id] ?? section.defaultOpen;
          const SectionIcon = section.icon;

          return (
            <div key={section.id}>
              {!collapsed ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
              ) : (
                <div className="flex justify-center py-2">
                  <SectionIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div
                className={cn(
                  "space-y-1 overflow-hidden transition-all",
                  !collapsed && !isOpen && "h-0"
                )}
              >
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-primary to-primary/70" />
                      )}
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? `bg-gradient-to-br ${item.color} text-white shadow-sm`
                            : "bg-muted group-hover:bg-secondary"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      {!collapsed && <span className="text-sm">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="relative border-t p-4 space-y-2">
        {!collapsed ? (
          <UserInfo user={user} />
        ) : (
          <div className="flex justify-center">
            <UserAvatar user={user} />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
