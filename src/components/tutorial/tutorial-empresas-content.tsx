"use client";

import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TUTORIAL_EMPRESAS_STEPS,
  getTutorialEmpresasOpenLink,
} from "@/lib/tutorial-empresas-steps";

type TutorialEmpresasContentProps = {
  backHref: string;
  openLinkBasePath: string;
  prerequisiteDescription: string;
};

export function TutorialEmpresasContent({
  openLinkBasePath,
  prerequisiteDescription,
}: TutorialEmpresasContentProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pré-requisitos</CardTitle>
          <CardDescription>{prerequisiteDescription}</CardDescription>
        </CardHeader>
      </Card>

      {TUTORIAL_EMPRESAS_STEPS.map((step) => (
        <Card key={step.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-8 justify-center">
                {step.id}
              </Badge>
              {step.optional && (
                <Badge variant="outline" className="text-xs">
                  Opcional
                </Badge>
              )}
              <CardTitle className="text-lg">{step.title}</CardTitle>
            </div>
            <CardDescription className="mt-1">{step.action}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                O que você verá
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {step.whatYouWillSee.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground font-mono pt-1">{step.route}</p>
            </div>
            <Link
              href={getTutorialEmpresasOpenLink(openLinkBasePath, step)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir tela
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
          <CardContent className="p-0 pt-2">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Link Fathom:</strong> Disponível por
                workshop/hotseat no modal. Para link geral da empresa, use Recursos (tipo Link) na
                página da empresa.
              </li>
              <li>
                <strong className="text-foreground">Contrato:</strong> No card Recursos, adicione
                recurso tipo Documento ou Link com título &quot;Contrato&quot; e a URL.
              </li>
              <li>
                <strong className="text-foreground">Edição (CS):</strong> O CS só edita empresas das
                quais é responsável (badge &quot;Pode editar&quot;). Use a aba Minhas na lista para
                ver só as suas.
              </li>
            </ul>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
