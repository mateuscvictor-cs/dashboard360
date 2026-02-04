"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { TutorialEmpresasContent } from "@/components/tutorial/tutorial-empresas-content";

export default function TutorialEmpresasPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Tutorial: Adicionar informações às empresas"
        subtitle="Passo a passo com indicação de prints para documentação"
        showFilters={false}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cs/tutoriais">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Como cadastrar entregas, workshops, hotseats (com link Fathom), contatos, logo, recursos (contrato/links) e onboarding nas empresas que você atende.
          </p>
        </div>
        <TutorialEmpresasContent
          backHref="/cs/tutoriais"
          openLinkBasePath="/cs"
          prerequisiteDescription={'Usuário logado como CS Owner; pelo menos uma empresa atribuída (para poder editar). Use o botão "Abrir tela" em cada passo para ir à tela e tirar o print.'}
        />
      </div>
    </div>
  );
}
