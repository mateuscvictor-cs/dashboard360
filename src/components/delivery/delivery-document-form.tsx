"use client";

import { useState } from "react";
import {
  FileText,
  Video,
  Link as LinkIcon,
  File,
} from "lucide-react";
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

interface DeliveryDocumentFormProps {
  deliveryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const documentTypes = [
  { value: "PRESENTATION", label: "Apresentação", icon: FileText },
  { value: "SPREADSHEET", label: "Planilha", icon: FileText },
  { value: "PDF", label: "PDF", icon: FileText },
  { value: "VIDEO", label: "Vídeo", icon: Video },
  { value: "LINK", label: "Link", icon: LinkIcon },
  { value: "OTHER", label: "Outro", icon: File },
];

export function DeliveryDocumentForm({
  deliveryId,
  onClose,
  onSuccess,
}: DeliveryDocumentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    type: "LINK",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          url: formData.url,
          type: formData.type,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao salvar documento");
      }
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      alert("Erro ao salvar documento");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = documentTypes.find((t) => t.value === formData.type);
  const TypeIcon = selectedType?.icon || File;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Título *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Apresentação de Kickoff"
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
                {documentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">URL *</label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://docs.google.com/..."
              type="url"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do documento..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Documento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
