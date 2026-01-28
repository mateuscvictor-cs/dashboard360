"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeliveryApprovalActionsProps {
  deliveryId: string;
  status: string;
  clientApprovalStatus: string | null;
  onApproved: () => void;
}

const approvalStatusConfig = {
  PENDING_APPROVAL: {
    icon: Clock,
    label: "Aguardando Aprovação",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  APPROVED: {
    icon: CheckCircle,
    label: "Aprovado",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  CHANGES_REQUESTED: {
    icon: AlertTriangle,
    label: "Alterações Solicitadas",
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
};

export function DeliveryApprovalActions({
  deliveryId,
  status,
  clientApprovalStatus,
  onApproved,
}: DeliveryApprovalActionsProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  const canApprove =
    status === "COMPLETED" ||
    clientApprovalStatus === "PENDING_APPROVAL" ||
    clientApprovalStatus === "CHANGES_REQUESTED";

  const currentStatus = clientApprovalStatus
    ? approvalStatusConfig[clientApprovalStatus as keyof typeof approvalStatusConfig]
    : null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/cliente/deliveries/${deliveryId}/approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            comment: approveComment || null,
          }),
        }
      );

      if (response.ok) {
        setShowApproveModal(false);
        setApproveComment("");
        onApproved();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao aprovar entrega");
      }
    } catch (error) {
      console.error("Erro ao aprovar entrega:", error);
      alert("Erro ao aprovar entrega");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!rejectReason.trim()) {
      alert("Por favor, descreva as alterações necessárias");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/cliente/deliveries/${deliveryId}/approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "request_changes",
            reason: rejectReason,
          }),
        }
      );

      if (response.ok) {
        setShowRejectModal(false);
        setRejectReason("");
        onApproved();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao solicitar alterações");
      }
    } catch (error) {
      console.error("Erro ao solicitar alterações:", error);
      alert("Erro ao solicitar alterações");
    } finally {
      setLoading(false);
    }
  };

  if (!canApprove && clientApprovalStatus === "APPROVED") {
    return (
      <Card className="p-4 bg-green-500/5 border-green-500/20">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h4 className="font-medium text-green-700">Entrega Aprovada</h4>
            <p className="text-sm text-green-600">
              Você aprovou esta entrega.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!canApprove) {
    return null;
  }

  return (
    <>
      <Card className="p-4 border-2 border-dashed">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Aprovação da Entrega</h4>
              <p className="text-sm text-muted-foreground">
                Revise a entrega e aprove ou solicite alterações
              </p>
            </div>
            {currentStatus && (
              <Badge variant="outline" className={currentStatus.color}>
                <currentStatus.icon className="h-3 w-3 mr-1" />
                {currentStatus.label}
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="default"
              onClick={() => setShowApproveModal(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprovar Entrega
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => setShowRejectModal(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Solicitar Alterações
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Aprovar Entrega
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Ao aprovar, você confirma que a entrega atende às suas
              expectativas.
            </p>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Comentário (opcional)
              </label>
              <Textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Deixe um comentário sobre a entrega..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowApproveModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Aprovando..." : "Confirmar Aprovação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Solicitar Alterações
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Descreva as alterações necessárias para que a equipe possa
              ajustar a entrega.
            </p>

            <div>
              <label className="text-sm font-medium mb-1 block">
                O que precisa ser alterado? *
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva detalhadamente as alterações necessárias..."
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRequestChanges}
                disabled={loading || !rejectReason.trim()}
                variant="destructive"
              >
                {loading ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
