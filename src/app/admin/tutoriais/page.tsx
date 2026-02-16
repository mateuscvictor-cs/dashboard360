"use client";

import Link from "next/link";
import { BookOpen, Building2, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tutorials = [
  {
    slug: "empresas",
    title: "Adicionar informações às empresas",
    description:
      "Como cadastrar entregas, workshops, hotseats (com link Fathom), contatos, logo, recursos (contrato/links) e onboarding nas empresas. Visão CS e Admin.",
    icon: Building2,
    href: "/admin/tutoriais/empresas",
  },
];

export default function AdminTutoriaisPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Tutoriais"
        subtitle="Como utilizar o sistema (Admin e CS)"
        showFilters={false}
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-muted-foreground text-sm">
            Use os tutoriais abaixo para aprender o fluxo de uso do Dashboard 360. Cada tutorial traz passos com indicação de onde tirar prints para documentação ou treinamento.
          </p>
          <div className="grid gap-4">
            {tutorials.map((t) => (
              <Link key={t.slug} href={t.href}>
                <Card className="transition-all hover:shadow-md hover:border-primary/30">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white">
                      <t.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{t.title}</CardTitle>
                      <CardDescription className="mt-1">{t.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                      <span>
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Button>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
            <BookOpen className="h-4 w-4" />
            <span>Novos tutoriais podem ser adicionados aqui conforme a necessidade do time.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
