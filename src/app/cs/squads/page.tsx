"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Building2,
  AlertCircle,
  Search,
  Eye,
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

export default function CSSquadsPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/squads");
      if (res.ok) setSquads(await res.json());
    } catch (error) {
      console.error("Erro ao carregar squads:", error);
    }
    setLoading(false);
  }

  function openDetailsModal(squad: Squad) {
    setSelectedSquad(squad);
    setShowDetailsModal(true);
  }

  const filteredSquads = squads.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Squads" subtitle="Visualização das equipes" showFilters={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Squads" subtitle="Visualização das equipes" showFilters={false} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
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
          <Badge variant="secondary" className="text-sm">
            {squads.length} squads disponíveis
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-4">
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
              <p className="text-3xl font-bold">
                {Math.round(squads.reduce((acc, s) => acc + s.currentLoad, 0) / (squads.length || 1))}%
              </p>
              <p className="text-sm text-muted-foreground">Carga Média</p>
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openDetailsModal(squad)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

                    <div className="grid grid-cols-2 gap-3">
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
                            className="relative"
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
            <p className="text-muted-foreground">
              {searchQuery ? "Tente uma busca diferente" : "Não há squads cadastrados"}
            </p>
          </div>
        )}
      </div>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                {selectedSquad?.name.substring(0, 2).toUpperCase()}
              </div>
              {selectedSquad?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{selectedSquad?.members.length}</p>
                <p className="text-xs text-muted-foreground">Membros</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{selectedSquad?.accountsCount}</p>
                <p className="text-xs text-muted-foreground">Contas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{selectedSquad?.currentLoad}%</p>
                <p className="text-xs text-muted-foreground">Capacidade</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Membros do Squad</h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                {selectedSquad?.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm font-semibold">
                        {member.csOwner.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                        member.csOwner.status === "ONLINE" && "bg-success",
                        member.csOwner.status === "BUSY" && "bg-warning",
                        member.csOwner.status === "OFFLINE" && "bg-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.csOwner.name}</p>
                      <Badge 
                        variant={
                          member.csOwner.status === "ONLINE" ? "success" : 
                          member.csOwner.status === "BUSY" ? "warning" : "secondary"
                        }
                        size="sm"
                      >
                        {member.csOwner.status === "ONLINE" ? "Online" : 
                         member.csOwner.status === "BUSY" ? "Ocupado" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {selectedSquad?.members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro neste squad
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
