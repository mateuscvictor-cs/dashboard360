"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  X,
  Plus,
  Trash2,
  User,
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
import { Badge } from "@/components/ui/badge";

type Participant = {
  id?: string;
  name: string;
  email?: string | null;
  role?: string | null;
  contactId?: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  duration: number | null;
  meetingLink: string | null;
  fathomLink: string | null;
  notes: string | null;
  status: string;
  participants: {
    id: string;
    name: string;
    email: string | null;
    role: string | null;
    attended: boolean;
    contact: { id: string; name: string; email: string } | null;
  }[];
};

interface DeliveryMeetingFormProps {
  deliveryId: string;
  companyId: string;
  meeting?: Meeting | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryMeetingForm({
  deliveryId,
  companyId,
  meeting,
  onClose,
  onSuccess,
}: DeliveryMeetingFormProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    title: meeting?.title || "",
    description: meeting?.description || "",
    date: meeting?.date ? new Date(meeting.date).toISOString().slice(0, 16) : "",
    duration: meeting?.duration?.toString() || "",
    meetingLink: meeting?.meetingLink || "",
    fathomLink: meeting?.fathomLink || "",
    notes: meeting?.notes || "",
    status: meeting?.status || "SCHEDULED",
  });
  const [participants, setParticipants] = useState<Participant[]>(
    meeting?.participants.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      contactId: p.contact?.id,
    })) || []
  );
  const [newParticipant, setNewParticipant] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    fetchContacts();
  }, [companyId]);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/contacts`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = meeting
        ? `/api/deliveries/${deliveryId}/meetings/${meeting.id}`
        : `/api/deliveries/${deliveryId}/meetings`;
      
      const method = meeting ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description || null,
        date: formData.date,
        duration: formData.duration ? parseInt(formData.duration) : null,
        meetingLink: formData.meetingLink || null,
        fathomLink: formData.fathomLink || null,
        notes: formData.notes || null,
        status: formData.status,
      };

      if (!meeting) {
        body.participants = participants.map((p) => ({
          name: p.name,
          email: p.email,
          role: p.role,
          contactId: p.contactId,
        }));
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao salvar reunião");
      }
    } catch (error) {
      console.error("Erro ao salvar reunião:", error);
      alert("Erro ao salvar reunião");
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    setParticipants([...participants, { ...newParticipant }]);
    setNewParticipant({ name: "", email: "", role: "" });
  };

  const addContactAsParticipant = (contact: Contact) => {
    if (participants.some((p) => p.contactId === contact.id)) return;
    setParticipants([
      ...participants,
      {
        name: contact.name,
        email: contact.email,
        role: contact.role || undefined,
        contactId: contact.id,
      },
    ]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? "Editar Reunião" : "Nova Reunião"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Reunião de Kickoff"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da reunião..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Data e Hora *</label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Duração (min)</label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <Video className="h-4 w-4 inline mr-1" />
                  Link da Reunião
                </label>
                <Input
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Link do Fathom
                </label>
                <Input
                  value={formData.fathomLink}
                  onChange={(e) => setFormData({ ...formData, fathomLink: e.target.value })}
                  placeholder="https://fathom.video/..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Agendada</SelectItem>
                  <SelectItem value="COMPLETED">Realizada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="RESCHEDULED">Reagendada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notas</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações da reunião..."
                rows={3}
              />
            </div>

            {!meeting && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-3 block">
                  <Users className="h-4 w-4 inline mr-1" />
                  Participantes
                </label>

                {contacts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Adicionar contato da empresa:</p>
                    <div className="flex flex-wrap gap-2">
                      {contacts.map((contact) => {
                        const isAdded = participants.some((p) => p.contactId === contact.id);
                        return (
                          <Button
                            key={contact.id}
                            type="button"
                            variant={isAdded ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => !isAdded && addContactAsParticipant(contact)}
                            disabled={isAdded}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {contact.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-3">
                  <Input
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    placeholder="Nome"
                    className="flex-1"
                  />
                  <Input
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                    placeholder="Email"
                    className="flex-1"
                  />
                  <Input
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })}
                    placeholder="Cargo"
                    className="w-32"
                  />
                  <Button type="button" variant="outline" onClick={addParticipant}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {participants.length > 0 && (
                  <div className="space-y-2">
                    {participants.map((p, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{p.name}</span>
                          {p.email && <span className="text-sm text-muted-foreground">({p.email})</span>}
                          {p.role && <Badge variant="secondary" size="sm">{p.role}</Badge>}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParticipant(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : meeting ? "Salvar" : "Criar Reunião"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
