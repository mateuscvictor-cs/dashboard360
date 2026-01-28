"use client";

import { useState } from "react";
import { Key, FileText, CheckCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeliveryDependencyFormProps {
  deliveryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const dependencyTypes = [
  { value: "ACCESS", label: "Acesso", icon: Key, description: "Acessos a sistemas ou plataformas" },
  { value: "DOCUMENT", label: "Documento", icon: FileText, description: "Documentos que o cliente precisa fornecer" },
  { value: "APPROVAL", label: "Aprovação", icon: CheckCircle, description: "Aprovações necessárias" },
  { value: "INFORMATION", label: "Informação", icon: Info, description: "Informações ou dados" },
];

export function DeliveryDependencyForm({
  deliveryId,
  onClose,
  onSuccess,
}: DeliveryDependencyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "ACCESS",
    dueDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar dependência");
      }
    } catch (error) {
      console.error("Erro ao criar dependência:", error);
      alert("Erro ao criar dependência");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = dependencyTypes.find((t) => t.value === formData.type);
  const TypeIcon = selectedType?.icon || Key;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Dependência do Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Acesso ao Google Analytics"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {dependencyTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedType.description}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Prazo</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes sobre o que é necessário..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Dependência"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
