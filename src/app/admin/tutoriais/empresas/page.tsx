"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { TutorialEmpresasContent } from "@/components/tutorial/tutorial-empresas-content";

export default function AdminTutorialEmpresasPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Tutorial: Adicionar informações às empresas"
        subtitle="Passo a passo com indicação de prints para documentação"
        showFilters={false}
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/tutoriais">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Como cadastrar entregas, workshops, hotseats (com link Fathom), contatos, logo, recursos (contrato/links) e onboarding. Os botões &quot;Abrir tela&quot; levam às telas da área Admin.
          </p>
        </div>
        <TutorialEmpresasContent
          backHref="/admin/tutoriais"
          openLinkBasePath="/admin"
          prerequisiteDescription={'Usuário logado como Admin (ou CS Owner na área CS). Use o botão "Abrir tela" em cada passo para ir à tela e tirar o print.'}
        />
      </div>
    </div>
  );
}
