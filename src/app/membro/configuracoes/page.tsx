"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Building2, Shield } from "lucide-react";
import { useUserProfile } from "@/components/layout/user-avatar";

export default function ConfiguracoesPage() {
    const { user, loading } = useUserProfile();
    const [companyName, setCompanyName] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCompany() {
            try {
                const response = await fetch("/api/cliente/company");
                if (response.ok) {
                    const data = await response.json();
                    setCompanyName(data.name);
                }
            } catch (error) {
                console.error("Erro ao buscar empresa:", error);
            }
        }
        fetchCompany();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground mt-2">
                    Gerencie suas preferências e informações de perfil.
                </p>
            </div>

            <div className="space-y-6">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Perfil
                        </CardTitle>
                        <CardDescription>Suas informações de conta</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xl font-bold">
                                {user?.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "U"}
                            </div>
                            <div>
                                <p className="text-lg font-semibold">{user?.name || "Usuário"}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {user?.email || "email@exemplo.com"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    Empresa
                                </p>
                                <p className="font-medium text-sm">{companyName || "Não definida"}</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Função
                                </p>
                                <Badge variant="secondary">Membro</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Preferências</CardTitle>
                        <CardDescription>Personalize sua experiência</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Em breve você poderá personalizar notificações e outras configurações.
                        </p>
                    </CardContent>
                </Card>

                {/* Help Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Precisa de ajuda?</CardTitle>
                        <CardDescription>Entre em contato com o suporte</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => window.open("mailto:suporte@vanguardia.com.br", "_blank")}>
                            Enviar email para suporte
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
