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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface ClientDependencyCardProps {
  deliveryId: string;
  dependency: Dependency;
  onProvided: () => void;
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
  NOT_NEEDED: { icon: CheckCircle2, label: "Não necessário", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export function ClientDependencyCard({
  deliveryId,
  dependency,
  onProvided,
}: ClientDependencyCardProps) {
  const [showProvideModal, setShowProvideModal] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const type = typeConfig[dependency.type];
  const status = statusConfig[dependency.status];
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  const isPending = dependency.status === "PENDING" || dependency.status === "OVERDUE";
  const isOverdue = dependency.status === "OVERDUE";

  const handleProvide = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/cliente/deliveries/${deliveryId}/dependencies/${dependency.id}/provide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note || null }),
        }
      );

      if (response.ok) {
        setShowProvideModal(false);
        setNote("");
        onProvided();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao marcar como fornecido");
      }
    } catch (error) {
      console.error("Erro ao fornecer dependência:", error);
      alert("Erro ao marcar como fornecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className={`p-4 border ${isPending ? "border-yellow-500/30" : ""} ${isOverdue ? "border-red-500/30 bg-red-500/5" : ""}`}>
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
            <h4 className="font-medium">{dependency.title}</h4>
            {dependency.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {dependency.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {dependency.dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                  <Clock className="h-3 w-3" />
                  Prazo: {new Date(dependency.dueDate).toLocaleDateString("pt-BR")}
                  {isOverdue && " (Atrasado)"}
                </span>
              )}
              {dependency.providedAt && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Fornecido em: {new Date(dependency.providedAt).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            {dependency.providedNote && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                Sua nota: {dependency.providedNote}
              </p>
            )}
          </div>
          {isPending && (
            <Button
              size="sm"
              variant={isOverdue ? "destructive" : "default"}
              onClick={() => setShowProvideModal(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Marcar como fornecido
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={showProvideModal} onOpenChange={setShowProvideModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Fornecimento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={type.color}>
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {type.label}
                </Badge>
              </div>
              <h4 className="font-medium">{dependency.title}</h4>
              {dependency.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {dependency.description}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Observação (opcional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Enviei os dados por email para o CS responsável..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProvideModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleProvide} disabled={loading}>
                {loading ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
