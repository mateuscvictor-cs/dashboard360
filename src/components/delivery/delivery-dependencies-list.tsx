"use client";

import { useState } from "react";
import {
  Key,
  FileText,
  CheckCircle,
  Info,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeliveryDependencyForm } from "./delivery-dependency-form";

interface Dependency {
  id: string;
  title: string;
  description: string | null;
  type: "ACCESS" | "DOCUMENT" | "APPROVAL" | "INFORMATION";
  status: "PENDING" | "PROVIDED" | "OVERDUE" | "NOT_NEEDED";
  dueDate: string | null;
  providedAt: string | null;
  providedNote: string | null;
}

interface DeliveryDependenciesListProps {
  deliveryId: string;
  dependencies: Dependency[];
  onRefresh: () => void;
  readonly?: boolean;
}

const typeConfig = {
  ACCESS: { icon: Key, label: "Acesso", color: "bg-blue-500/10 text-blue-600" },
  DOCUMENT: { icon: FileText, label: "Documento", color: "bg-purple-500/10 text-purple-600" },
  APPROVAL: { icon: CheckCircle, label: "Aprovação", color: "bg-green-500/10 text-green-600" },
  INFORMATION: { icon: Info, label: "Informação", color: "bg-orange-500/10 text-orange-600" },
};

const statusConfig = {
  PENDING: { icon: Clock, label: "Pendente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  PROVIDED: { icon: CheckCircle2, label: "Fornecido", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  OVERDUE: { icon: AlertCircle, label: "Atrasado", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  NOT_NEEDED: { icon: XCircle, label: "Não necessário", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export function DeliveryDependenciesList({
  deliveryId,
  dependencies,
  onRefresh,
  readonly = false,
}: DeliveryDependenciesListProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const pendingCount = dependencies.filter(
    (d) => d.status === "PENDING" || d.status === "OVERDUE"
  ).length;

  const handleDelete = async (depId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta dependência?")) return;

    setDeleting(depId);
    try {
      const response = await fetch(
        `/api/deliveries/${deliveryId}/dependencies/${depId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao excluir dependência");
      }
    } catch (error) {
      console.error("Erro ao excluir dependência:", error);
      alert("Erro ao excluir dependência");
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (depId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `/api/deliveries/${deliveryId}/dependencies/${depId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Dependências do Cliente</h3>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {!readonly && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      {dependencies.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>Nenhuma dependência cadastrada</p>
          {!readonly && (
            <p className="text-sm mt-1">
              Adicione acessos, documentos ou aprovações necessárias do cliente
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep) => {
            const type = typeConfig[dep.type];
            const status = statusConfig[dep.status];
            const TypeIcon = type.icon;
            const StatusIcon = status.icon;

            return (
              <Card key={dep.id} className={`p-4 border ${status.color}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={type.color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {type.label}
                      </Badge>
                      <Badge variant="outline" className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{dep.title}</h4>
                    {dep.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {dep.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {dep.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Prazo: {new Date(dep.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {dep.providedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Fornecido em: {new Date(dep.providedAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    {dep.providedNote && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Nota: {dep.providedNote}
                      </p>
                    )}
                  </div>
                  {!readonly && (
                    <div className="flex items-center gap-2">
                      {dep.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(dep.id, "NOT_NEEDED")}
                        >
                          Não necessário
                        </Button>
                      )}
                      {dep.status === "NOT_NEEDED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(dep.id, "PENDING")}
                        >
                          Reativar
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(dep.id)}
                        disabled={deleting === dep.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <DeliveryDependencyForm
          deliveryId={deliveryId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
