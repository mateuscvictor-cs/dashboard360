"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Plus,
    Sparkles,
    Loader2,
    Trash2,
    CheckSquare,
    Calendar,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    createMeetingRecord,
    analyzeMeetingRecord,
    getMeetingRecords,
    deleteMeetingRecord,
    createDemandsFromActionItems,
} from "./meeting-record.actions";

type ActionItem = {
    description: string;
    priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
    suggestedAssignee: string;
    dueInDays: number;
};

type MeetingRecord = {
    id: string;
    title: string;
    date: string;
    transcription: string;
    summary: string | null;
    actionItems: ActionItem[] | null;
    createdAt: string;
};

interface TranscriptionManagerProps {
    companyId: string;
    csOwnerId?: string;
}

const priorityColors: Record<string, string> = {
    URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
    HIGH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    LOW: "bg-green-500/10 text-green-500 border-green-500/20",
};

export function TranscriptionManager({ companyId, csOwnerId }: TranscriptionManagerProps) {
    const [records, setRecords] = useState<MeetingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: "", date: "", transcription: "" });
    const [saving, setSaving] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [creatingDemands, setCreatingDemands] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [companyId]);

    const loadRecords = async () => {
        try {
            const data = await getMeetingRecords(companyId);
            setRecords(
                data.map((r) => ({
                    id: r.id,
                    title: r.title,
                    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
                    transcription: r.transcription,
                    summary: r.summary,
                    actionItems: r.actionItems as ActionItem[] | null,
                    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
                }))
            );
        } catch (error) {
            console.error("Erro ao carregar transcrições:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.date || !formData.transcription) return;
        setSaving(true);
        try {
            await createMeetingRecord({
                companyId,
                title: formData.title,
                date: new Date(formData.date),
                transcription: formData.transcription,
            });
            setFormData({ title: "", date: "", transcription: "" });
            setShowForm(false);
            await loadRecords();
        } catch (error) {
            console.error("Erro ao criar:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyze = async (id: string) => {
        setAnalyzingId(id);
        try {
            await analyzeMeetingRecord(id);
            await loadRecords();
            setExpandedId(id);
        } catch (error) {
            console.error("Erro ao analisar:", error);
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir esta transcrição?")) return;
        try {
            await deleteMeetingRecord(id);
            await loadRecords();
        } catch (error) {
            console.error("Erro ao excluir:", error);
        }
    };

    const toggleItem = (recordId: string, index: number) => {
        const key = `${recordId}-${index}`;
        setSelectedItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCreateDemands = async (record: MeetingRecord) => {
        const items = (record.actionItems || []).filter(
            (_, i) => selectedItems[`${record.id}-${i}`]
        );
        if (items.length === 0) return;

        setCreatingDemands(true);
        try {
            await createDemandsFromActionItems(companyId, items, csOwnerId);
            setSelectedItems({});
            alert(`${items.length} demanda(s) criada(s) com sucesso!`);
        } catch (error) {
            console.error("Erro ao criar demandas:", error);
        } finally {
            setCreatingDemands(false);
        }
    };

    const getSelectedCount = (record: MeetingRecord) => {
        return (record.actionItems || []).filter((_, i) => selectedItems[`${record.id}-${i}`]).length;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Transcrições de Reuniões
                            </CardTitle>
                            <CardDescription>
                                Cadastre transcrições e use IA para gerar resumos e próximos passos
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Transcrição
                        </Button>
                    </div>
                </CardHeader>

                {showForm && (
                    <CardContent className="border-t pt-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Título da Reunião *</label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Reunião de alinhamento"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Data *</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Transcrição *</label>
                                <Textarea
                                    value={formData.transcription}
                                    onChange={(e) => setFormData({ ...formData, transcription: e.target.value })}
                                    placeholder="Cole aqui a transcrição completa da reunião..."
                                    className="min-h-[200px]"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowForm(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreate} disabled={saving} className="gap-2">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className={showForm ? "" : ""}>
                    {records.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma transcrição cadastrada</p>
                            <p className="text-sm">Clique em "Nova Transcrição" para começar</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {records.map((record) => (
                                <div key={record.id} className="border rounded-lg overflow-hidden">
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                                        onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{record.title}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(record.date).toLocaleDateString("pt-BR")}
                                                    {record.summary && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            Analisado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!record.summary && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAnalyze(record.id);
                                                    }}
                                                    disabled={analyzingId === record.id}
                                                    className="gap-2"
                                                >
                                                    {analyzingId === record.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="h-4 w-4" />
                                                    )}
                                                    Analisar com IA
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(record.id);
                                                }}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            {expandedId === record.id ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    {expandedId === record.id && (
                                        <div className="border-t p-4 space-y-4 bg-muted/30">
                                            {record.summary && (
                                                <div>
                                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                                        <Sparkles className="h-4 w-4 text-primary" />
                                                        Resumo Executivo
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {record.summary}
                                                    </p>
                                                </div>
                                            )}

                                            {record.actionItems && record.actionItems.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium flex items-center gap-2">
                                                            <CheckSquare className="h-4 w-4 text-primary" />
                                                            Próximos Passos ({record.actionItems.length})
                                                        </h4>
                                                        {getSelectedCount(record) > 0 && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleCreateDemands(record)}
                                                                disabled={creatingDemands}
                                                                className="gap-2"
                                                            >
                                                                {creatingDemands ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Plus className="h-4 w-4" />
                                                                )}
                                                                Criar {getSelectedCount(record)} Demanda(s)
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {record.actionItems.map((item, i) => (
                                                            <label
                                                                key={i}
                                                                className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItems[`${record.id}-${i}`] || false}
                                                                    onChange={() => toggleItem(record.id, i)}
                                                                    className="mt-1 rounded"
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="text-sm">{item.description}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Badge className={priorityColors[item.priority]}>
                                                                            {item.priority}
                                                                        </Badge>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {item.suggestedAssignee} • {item.dueInDays} dias
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="font-medium mb-2">Transcrição Original</h4>
                                                <div className="max-h-[200px] overflow-y-auto text-sm text-muted-foreground bg-background rounded border p-3 whitespace-pre-wrap">
                                                    {record.transcription}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
