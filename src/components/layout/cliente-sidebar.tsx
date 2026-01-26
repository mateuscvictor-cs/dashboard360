"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useUserProfile, UserInfo, UserAvatar } from "./user-avatar";

const navigation = [
  { name: "Dashboard", href: "/cliente/dashboard", icon: LayoutDashboard, color: "from-indigo-500 to-purple-500" },
  { name: "Entregas", href: "/cliente/entregas", icon: Package, color: "from-emerald-500 to-teal-500" },
  { name: "Pesquisas", href: "/cliente/pesquisas", icon: ClipboardList, color: "from-amber-500 to-orange-500" },
  { name: "Recursos", href: "/cliente/recursos", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  { name: "Documentação", href: "/cliente/documentacao", icon: FileText, color: "from-blue-500 to-cyan-500" },
  { name: "Suporte", href: "/cliente/suporte", icon: MessageSquare, color: "from-pink-500 to-rose-500" },
  { name: "Configurações", href: "/cliente/configuracoes", icon: Settings, color: "from-slate-500 to-zinc-500" },
];

type CompanyInfo = {
  name: string;
  logo: string | null;
  framework: string | null;
};

export function ClienteSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUserProfile();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    async function fetchCompanyInfo() {
      try {
        const response = await fetch("/api/cliente/company");
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados da empresa:", error);
      }
    }
    fetchCompanyInfo();
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const renderLogo = (collapsed: boolean) => {
    if (companyInfo?.logo) {
      return (
        <Image
          src={companyInfo.logo}
          alt={companyInfo.name}
          width={36}
          height={36}
          className="rounded-xl object-cover"
        />
      );
    }
    return (
      <Image
        src="/logo-vanguardia.png"
        alt="Vanguardia"
        width={collapsed ? 36 : 140}
        height={36}
        className={collapsed ? "h-9 w-9 object-contain" : "h-9 w-auto"}
      />
    );
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
          <Link href="/cliente/dashboard" className="flex items-center gap-3">
            {companyInfo?.logo ? (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md shadow-primary/25 overflow-hidden">
                  {renderLogo(false)}
                </div>
                <div>
                  <span className="font-bold text-base line-clamp-1">
                    {companyInfo.name}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                    {companyInfo.framework || "Vanguardia"}
                  </span>
                </div>
              </>
            ) : (
              renderLogo(false)
            )}
          </Link>
        )}
        {collapsed && (
          <Link href="/cliente/dashboard" className="mx-auto">
            {companyInfo?.logo ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md shadow-primary/25 overflow-hidden">
                {renderLogo(true)}
              </div>
            ) : (
              renderLogo(true)
            )}
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

      <nav className="relative flex-1 space-y-1 p-3">
        {!collapsed && (
          <span className="block px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </span>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/cliente/dashboard" && pathname.startsWith(item.href));
          
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
