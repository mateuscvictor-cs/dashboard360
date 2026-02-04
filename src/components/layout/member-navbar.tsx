"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Sparkles,
    Settings,
    LogOut,
    Bell,
    Menu,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useUserProfile, UserAvatar } from "./user-avatar";
import { NotificationBell } from "@/components/notifications";

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

const navigation: NavItem[] = [
    { name: "Dashboard", href: "/membro", icon: LayoutDashboard },
    { name: "Recursos", href: "/membro/recursos", icon: Sparkles },
    { name: "Configurações", href: "/membro/configuracoes", icon: Settings },
];

type CompanyInfo = {
    name: string;
    logo: string | null;
    framework: string | null;
};

export function MemberNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUserProfile();
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
            <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/membro" className="flex items-center gap-3">
                        {companyInfo?.logo ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md shadow-primary/25 overflow-hidden">
                                <Image
                                    src={companyInfo.logo}
                                    alt={companyInfo.name}
                                    width={36}
                                    height={36}
                                    className="rounded-xl object-cover"
                                />
                            </div>
                        ) : (
                            <Image
                                src="/logo-vanguardia.png"
                                alt="Vanguardia"
                                width={140}
                                height={36}
                                className="h-9 w-auto"
                            />
                        )}
                        {companyInfo?.name && (
                            <span className="hidden md:block font-bold text-base">
                                {companyInfo.name}
                            </span>
                        )}
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navigation.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/membro" && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        <NotificationBell />

                        <div className="hidden md:flex items-center gap-3 border-l pl-3">
                            <UserAvatar user={user} />
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-destructive"
                                title="Sair"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t bg-background">
                    <nav className="flex flex-col p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/membro" && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                        <div className="pt-4 border-t mt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Sair</span>
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
