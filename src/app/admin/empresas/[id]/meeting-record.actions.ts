"use server";

import { prisma } from "@/lib/db";
import { generateMeetingAnalysis } from "@/services/ai.service";
import { revalidatePath } from "next/cache";
import { Priority, DemandType, DemandStatus } from "@prisma/client";

type ActionItem = {
    description: string;
    priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
    suggestedAssignee: string;
    dueInDays: number;
};

export async function createMeetingRecord(data: {
    companyId: string;
    title: string;
    date: Date;
    transcription: string;
}) {
    const record = await prisma.meetingRecord.create({
        data: {
            title: data.title,
            date: data.date,
            transcription: data.transcription,
            companyId: data.companyId,
        },
    });

    revalidatePath(`/admin/empresas/${data.companyId}`);
    return record;
}

export async function analyzeMeetingRecord(recordId: string) {
    const record = await prisma.meetingRecord.findUnique({
        where: { id: recordId },
        include: { company: { select: { name: true } } },
    });

    if (!record) {
        throw new Error("Registro não encontrado");
    }

    const analysis = await generateMeetingAnalysis({
        companyName: record.company.name,
        meetingTitle: record.title,
        meetingDate: record.date.toLocaleDateString("pt-BR"),
        transcription: record.transcription,
    });

    if (!analysis) {
        throw new Error("Falha ao analisar transcrição");
    }

    const updated = await prisma.meetingRecord.update({
        where: { id: recordId },
        data: {
            summary: analysis.summary,
            actionItems: analysis.actionItems,
        },
    });

    revalidatePath(`/admin/empresas/${record.companyId}`);
    return updated;
}

export async function getMeetingRecords(companyId: string) {
    return prisma.meetingRecord.findMany({
        where: { companyId },
        orderBy: { date: "desc" },
    });
}

export async function getMeetingRecord(id: string) {
    return prisma.meetingRecord.findUnique({
        where: { id },
        include: { company: { select: { id: true, name: true, csOwnerId: true } } },
    });
}

export async function deleteMeetingRecord(id: string) {
    const record = await prisma.meetingRecord.delete({ where: { id } });
    revalidatePath(`/admin/empresas/${record.companyId}`);
    return record;
}

export async function createDemandsFromActionItems(
    companyId: string,
    items: ActionItem[],
    csOwnerId?: string
) {
    const priorityMap: Record<string, Priority> = {
        URGENT: "URGENT",
        HIGH: "HIGH",
        MEDIUM: "MEDIUM",
        LOW: "LOW",
    };

    const demands = await Promise.all(
        items.map((item) =>
            prisma.demand.create({
                data: {
                    title: item.description,
                    type: "INTERNAL" as DemandType,
                    priority: priorityMap[item.priority] || "MEDIUM",
                    status: "OPEN" as DemandStatus,
                    dueDate: new Date(Date.now() + item.dueInDays * 24 * 60 * 60 * 1000),
                    companyId,
                    assignedToId: csOwnerId || undefined,
                },
            })
        )
    );

    revalidatePath(`/admin/empresas/${companyId}`);
    return demands;
}
