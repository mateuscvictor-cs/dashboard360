import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDateOnly(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  return formatDate(date);
}

export function getHealthColor(health: number): string {
  if (health >= 80) return "var(--color-health-healthy)";
  if (health >= 60) return "var(--color-health-attention)";
  if (health >= 40) return "var(--color-health-risk)";
  return "var(--color-health-critical)";
}

export function getHealthLabel(health: number): string {
  if (health >= 80) return "Saudável";
  if (health >= 60) return "Atenção";
  if (health >= 40) return "Risco";
  return "Crítico";
}

export type CadenceType = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "CUSTOM";

export function calculateNextDate(baseDate: Date | string, cadence: CadenceType | string | null): Date | null {
  if (!cadence || cadence === "CUSTOM") return null;
  const date = parseDateOnly(baseDate);
  
  switch (cadence.toUpperCase()) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "BIWEEKLY":
      date.setDate(date.getDate() + 14);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  
  return date;
}

export function calculateNextOccurrences(
  baseDate: Date | string,
  cadence: CadenceType | string | null,
  count: number = 5
): Date[] {
  if (!cadence || cadence === "CUSTOM") return [];
  const dates: Date[] = [];
  let currentDate = parseDateOnly(baseDate);
  
  for (let i = 0; i < count; i++) {
    const nextDate = calculateNextDate(currentDate, cadence);
    if (!nextDate) break;
    dates.push(nextDate);
    currentDate = nextDate;
  }
  
  return dates;
}

export function getCadenceLabel(cadence: string | null): string {
  if (!cadence) return "Sem cadência";
  
  const labels: Record<string, string> = {
    DAILY: "Diária",
    WEEKLY: "Semanal",
    BIWEEKLY: "Quinzenal",
    MONTHLY: "Mensal",
    CUSTOM: "Personalizada",
  };
  
  return labels[cadence.toUpperCase()] || cadence;
}

export function parseDateOnly(date: Date | string): Date {
  const s = typeof date === "string" ? date : date.toISOString();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(date);
}

export function getDaysUntil(date: Date | string): number {
  const target = parseDateOnly(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(parseDateOnly(date));
}
