"use client";

import { use } from "react";
import { DiagnosticAnalytics } from "@/components/diagnostic";

export default function CSDiagnosticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="p-4 sm:p-6">
      <DiagnosticAnalytics diagnosticId={id} backUrl="/cs/empresas" />
    </div>
  );
}
