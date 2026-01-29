"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { DiagnosticWizard, type DiagnosticFormData } from "@/components/diagnostic";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DiagnosticData {
  id: string;
  companyId: string;
  status: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  hasResponded: boolean;
}

export default function DiagnosticPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiagnostic() {
      try {
        const response = await fetch(`/api/cliente/diagnostic/${id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erro ao carregar diagnóstico");
        }
        const data = await response.json();
        setDiagnostic(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnostic();
  }, [id]);

  const handleSubmit = async (formData: DiagnosticFormData) => {
    const response = await fetch(`/api/cliente/diagnostic/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.identification.fullName,
        position: formData.identification.position,
        area: formData.identification.area,
        timeInCompany: formData.identification.timeInCompany,
        directlyInvolved: formData.identification.directlyInvolved,
        directManager: formData.identification.directManager,
        topFiveTasks: formData.routine.topFiveTasks,
        topTwoTimeTasks: formData.routine.topTwoTimeTasks,
        copyPasteTask: formData.routine.copyPasteTask,
        reworkArea: formData.routine.reworkArea,
        humanErrorArea: formData.routine.humanErrorArea,
        dependencyArea: formData.routine.dependencyArea,
        frustration: formData.routine.frustration,
        taskDetails: formData.taskDetails,
        systemsData: formData.systems,
        priorityData: formData.priority,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erro ao enviar diagnóstico");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando diagnóstico...</p>
        </div>
      </div>
    );
  }

  if (error || !diagnostic) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Erro ao carregar</h1>
          <p className="text-muted-foreground">{error || "Diagnóstico não encontrado"}</p>
          <Link href="/cliente/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (diagnostic.hasResponded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <AlertCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Diagnóstico já respondido</h1>
          <p className="text-muted-foreground">
            Você já respondeu este diagnóstico. Obrigado pela participação!
          </p>
          <Link href="/cliente/dashboard">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <DiagnosticWizard
        diagnosticId={id}
        companyName={diagnostic.company.name}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
