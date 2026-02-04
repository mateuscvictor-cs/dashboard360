import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const MAX_FILE_BYTES = 1 * 1024 * 1024;
const MAX_ROWS = 2000;

const EXPECTED_HEADER = [
  "Clientes",
  "CS Care",
  "Tech Responsável",
  "Início do Projeto",
  "Final do Projeto",
  "Framework",
  "Status do Projeto",
  "Link do NotebookLM",
  "Link do ClickUP",
  "Observações",
];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      if (text[i] === '"') {
        i++;
        let field = "";
        while (i < len) {
          if (text[i] === '"') {
            i++;
            if (text[i] === '"') {
              field += '"';
              i++;
            } else break;
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
        if (text[i] === ",") i++;
        else if (text[i] === "\n" || text[i] === "\r") break;
      } else {
        let field = "";
        while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i];
          i++;
        }
        row.push(field.trim());
        if (text[i] === "\r") i++;
        if (text[i] === "\n") { i++; break; }
        if (text[i] === ",") i++;
      }
    }
    if (row.length > 0) rows.push(row);
    while (i < len && (text[i] === "\n" || text[i] === "\r")) i++;
  }
  return rows;
}

function parseDate(val: string): Date | null {
  const s = (val || "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const parts = s.split(/[/.-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10));
    if (a > 12) return new Date(a, (b || 1) - 1, c || 1);
    if (c && c > 12) return new Date(c, (b || 1) - 1, a || 1);
    return new Date(b || 1, (a || 1) - 1, c || 1);
  }
  return null;
}

function getCell(row: string[], header: string[], col: string): string {
  const idx = header.indexOf(col);
  if (idx < 0 || idx >= row.length) return "";
  return (row[idx] ?? "").trim();
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Arquivo maior que ${MAX_FILE_BYTES / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json({ error: "Arquivo sem cabeçalho ou linhas de dados" }, { status: 400 });
    }
    if (rows.length - 1 > MAX_ROWS) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_ROWS} linhas permitido` },
        { status: 400 }
      );
    }

    const header = rows[0].map((c) => (c ?? "").trim().replace(/^\uFEFF/, ""));
    const missing = EXPECTED_HEADER.filter((h) => !header.includes(h));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Cabeçalho inválido. Colunas esperadas: ${EXPECTED_HEADER.join(", ")}. Faltando: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const [csOwners, squads] = await Promise.all([
      prisma.cSOwner.findMany({ select: { id: true, name: true } }),
      prisma.squad.findMany({ select: { id: true, name: true } }),
    ]);
    const csOwnerByName = new Map(csOwners.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const squadByName = new Map(squads.map((s) => [s.name.trim().toLowerCase(), s.id]));

    let createdCount = 0;
    const skipped: { row: number; name: string; reason: string }[] = [];
    const errors: { row: number; name: string; message: string }[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = getCell(row, header, "Clientes");
      if (!name) continue;

      const csCare = getCell(row, header, "CS Care");
      const csOwnerId = csCare ? csOwnerByName.get(csCare.toLowerCase()) : null;
      if (!csOwnerId) {
        errors.push({ row: r + 1, name, message: "CS Care não encontrado no sistema" });
        continue;
      }

      const techResp = getCell(row, header, "Tech Responsável");
      const squadId = techResp ? squadByName.get(techResp.toLowerCase()) ?? null : null;

      const existing = await prisma.company.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      if (existing) {
        skipped.push({ row: r + 1, name, reason: "Empresa já existe" });
        continue;
      }

      const startVal = getCell(row, header, "Início do Projeto");
      const endVal = getCell(row, header, "Final do Projeto");
      const framework = getCell(row, header, "Framework") || undefined;
      const statusProjeto = getCell(row, header, "Status do Projeto");
      const onboardingStatus = statusProjeto || "NOVO";
      const docsLink = getCell(row, header, "Link do NotebookLM") || undefined;
      const fathomLink = getCell(row, header, "Link do ClickUP") || undefined;
      const obs = getCell(row, header, "Observações");
      const tags = obs ? [obs] : [];

      try {
        await prisma.company.create({
          data: {
            name,
            csOwnerId,
            squadId: squadId ?? undefined,
            contractStart: parseDate(startVal),
            contractEnd: parseDate(endVal),
            framework: framework || undefined,
            onboardingStatus,
            docsLink,
            fathomLink,
            tags,
          },
        });
        createdCount++;
      } catch (err) {
        errors.push({
          row: r + 1,
          name,
          message: err instanceof Error ? err.message : "Erro ao criar empresa",
        });
      }
    }

    return NextResponse.json({
      created: createdCount,
      skipped: skipped.length,
      errors: errors.length,
      skippedDetails: skipped,
      errorDetails: errors,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.error("Erro ao importar empresas:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao importar empresas" },
      { status: 500 }
    );
  }
}
