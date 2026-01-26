"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Building2,
  Users,
  LogOut,
  Package,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { useUserProfile, UserInfo, UserAvatar } from "./user-avatar";

const navigation = [
  { name: "Visão 360", href: "/admin", icon: LayoutDashboard, color: "from-indigo-500 to-purple-500" },
  { name: "Operação", href: "/admin/operacao", icon: ListTodo, color: "from-emerald-500 to-teal-500" },
  { name: "Squads", href: "/admin/squads", icon: Users, color: "from-violet-500 to-purple-500" },
  { name: "Empresas", href: "/admin/empresas", icon: Building2, color: "from-blue-500 to-cyan-500" },
  { name: "Entregas", href: "/admin/entregas", icon: Package, color: "from-amber-500 to-orange-500" },
  { name: "Insights IA", href: "/admin/insights", icon: Sparkles, color: "from-pink-500 to-rose-500" },
  { name: "Acessos", href: "/admin/acessos", icon: UserPlus, color: "from-cyan-500 to-blue-500" },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings, color: "from-slate-500 to-zinc-500" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUserProfile();

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-md shadow-primary/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base">Vanguardia</span>
              <span className="block text-[10px] text-muted-foreground font-medium tracking-wide uppercase">360 Panel</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-md shadow-primary/25 mx-auto">
            <Zap className="h-5 w-5 text-white" />
          </div>
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

      <nav className="relative flex-1 space-y-1 p-3">
        {!collapsed && (
          <span className="block px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </span>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-primary to-primary/70" />
              )}
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                isActive 
                  ? `bg-gradient-to-br ${item.color} text-white shadow-sm`
                  : "bg-muted group-hover:bg-secondary"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              {!collapsed && <span>{item.name}</span>}
            </Link>
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
