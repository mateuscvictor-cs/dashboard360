"use client";

import { use } from "react";
import { DiagnosticAnalytics } from "@/components/diagnostic";

export default function AdminDiagnosticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="p-6">
      <DiagnosticAnalytics diagnosticId={id} backUrl="/admin/empresas" canDeleteResponses />
    </div>
  );
}
