"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Building2,
  AlertCircle,
  UserPlus,
  UserMinus,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CSOwnerBasic = {
  id: string;
  name: string;
  avatar: string | null;
  status: string;
};

type SquadMember = {
  id: string;
  csOwner: CSOwnerBasic;
};

type Squad = {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  blockedItems: number;
  accountsCount: number;
  members: SquadMember[];
};

type CSOwner = {
  id: string;
  name: string;
  avatar: string | null;
  status: string;
  email: string;
};

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [csOwners, setCsOwners] = useState<CSOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    capacity: 100,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [squadsRes, csRes] = await Promise.all([
        fetch("/api/squads"),
        fetch("/api/cs-owners"),
      ]);
      
      if (squadsRes.ok) setSquads(await squadsRes.json());
      if (csRes.ok) setCsOwners(await csRes.json());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        await loadData();
        setShowCreateModal(false);
        setFormData({ name: "", capacity: 100 });
      }
    } catch (error) {
      console.error("Erro ao criar squad:", error);
    }
    setSaving(false);
  }

  async function handleUpdate() {
    if (!selectedSquad || !formData.name.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/squads/${selectedSquad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        await loadData();
        setShowEditModal(false);
        setSelectedSquad(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar squad:", error);
    }
    setSaving(false);
  }

  async function handleDelete(squad: Squad) {
    if (!confirm(`Tem certeza que deseja excluir o squad "${squad.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/squads/${squad.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao deletar squad:", error);
    }
  }

  async function handleAddMember(csOwnerId: string) {
    if (!selectedSquad) return;
    
    try {
      const res = await fetch(`/api/squads/${selectedSquad.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csOwnerId }),
      });
      
      if (res.ok) {
        const squadsRes = await fetch("/api/squads");
        if (squadsRes.ok) {
          const newSquads = await squadsRes.json();
          setSquads(newSquads);
          const updated = newSquads.find((s: Squad) => s.id === selectedSquad.id);
          if (updated) setSelectedSquad(updated);
        }
      }
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
    }
  }

  async function handleRemoveMember(csOwnerId: string) {
    if (!selectedSquad) return;
    
    try {
      const res = await fetch(`/api/squads/${selectedSquad.id}/members?csOwnerId=${csOwnerId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        const squadsRes = await fetch("/api/squads");
        if (squadsRes.ok) {
          const newSquads = await squadsRes.json();
          setSquads(newSquads);
          const updated = newSquads.find((s: Squad) => s.id === selectedSquad.id);
          if (updated) setSelectedSquad(updated);
        }
      }
    } catch (error) {
      console.error("Erro ao remover membro:", error);
    }
  }

  function openEditModal(squad: Squad) {
    setSelectedSquad(squad);
    setFormData({ name: squad.name, capacity: squad.capacity });
    setShowEditModal(true);
  }

  function openMembersModal(squad: Squad) {
    setSelectedSquad(squad);
    setShowMembersModal(true);
  }

  const filteredSquads = squads.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableCSOwners = selectedSquad
    ? csOwners.filter(cs => !selectedSquad.members.some(m => m.csOwner.id === cs.id))
    : [];

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Squads" subtitle="Gerenciamento de equipes" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Squads" subtitle="Gerenciamento de equipes" showFilters={false} />

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar squads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Squad
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{squads.length}</p>
              <p className="text-sm text-muted-foreground">Total de Squads</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">
                {squads.reduce((acc, s) => acc + s.members.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total de Membros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">
                {squads.reduce((acc, s) => acc + s.accountsCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warning">
                {squads.reduce((acc, s) => acc + s.blockedItems, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Itens Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredSquads.map((squad, index) => (
              <motion.div
                key={squad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold shadow-md">
                          {squad.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{squad.name}</CardTitle>
                          <CardDescription>{squad.members.length} membros</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openMembersModal(squad)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditModal(squad)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-danger hover:text-danger"
                          onClick={() => handleDelete(squad)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Capacidade</span>
                        <span className="font-medium">{squad.currentLoad}%</span>
                      </div>
                      <Progress 
                        value={squad.currentLoad} 
                        className={cn(
                          "h-2",
                          squad.currentLoad > 80 && "[&>div]:bg-danger"
                        )} 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-lg font-bold">{squad.accountsCount}</p>
                          <p className="text-xs text-muted-foreground">Contas</p>
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        squad.blockedItems > 0 ? "bg-danger/10" : "bg-muted/50"
                      )}>
                        <AlertCircle className={cn(
                          "h-4 w-4",
                          squad.blockedItems > 0 ? "text-danger" : "text-muted-foreground"
                        )} />
                        <div>
                          <p className={cn(
                            "text-lg font-bold",
                            squad.blockedItems > 0 && "text-danger"
                          )}>{squad.blockedItems}</p>
                          <p className="text-xs text-muted-foreground">Bloqueados</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Membros</p>
                      <div className="flex items-center gap-1">
                        {squad.members.slice(0, 4).map((member) => (
                          <div
                            key={member.id}
                            className="relative group"
                            title={member.csOwner.name}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold border-2 border-background">
                              {member.csOwner.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                              member.csOwner.status === "ONLINE" && "bg-success",
                              member.csOwner.status === "BUSY" && "bg-warning",
                              member.csOwner.status === "OFFLINE" && "bg-muted-foreground"
                            )} />
                          </div>
                        ))}
                        {squad.members.length > 4 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            +{squad.members.length - 4}
                          </div>
                        )}
                        {squad.members.length === 0 && (
                          <p className="text-xs text-muted-foreground">Nenhum membro</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredSquads.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum squad encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tente uma busca diferente" : "Crie seu primeiro squad"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Squad
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Squad</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border bg-background"
                placeholder="Ex: Squad Alpha"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacidade (empresas)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 100 }))}
                className="w-full h-10 px-3 rounded-lg border bg-background"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.name.trim()}>
              {saving ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Squad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Squad</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacidade (empresas)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 100 }))}
                className="w-full h-10 px-3 rounded-lg border bg-background"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={saving || !formData.name.trim()}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Membros - {selectedSquad?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Membros Atuais ({selectedSquad?.members.length || 0})</h4>
              <div className="space-y-2 max-h-48 overflow-auto">
                {selectedSquad?.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold">
                          {member.csOwner.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                          member.csOwner.status === "ONLINE" && "bg-success",
                          member.csOwner.status === "BUSY" && "bg-warning",
                          member.csOwner.status === "OFFLINE" && "bg-muted-foreground"
                        )} />
                      </div>
                      <span className="font-medium text-sm">{member.csOwner.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-danger hover:text-danger"
                      onClick={() => handleRemoveMember(member.csOwner.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {selectedSquad?.members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Adicionar Membro</h4>
              <div className="space-y-2 max-h-48 overflow-auto">
                {availableCSOwners.map((cs) => (
                  <div key={cs.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold">
                          {cs.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                          cs.status === "ONLINE" && "bg-success",
                          cs.status === "BUSY" && "bg-warning",
                          cs.status === "OFFLINE" && "bg-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cs.name}</p>
                        <p className="text-xs text-muted-foreground">{cs.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMember(cs.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                ))}
                {availableCSOwners.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Todos os CS já estão neste squad
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembersModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
