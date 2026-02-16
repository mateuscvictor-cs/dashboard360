import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomBytes } from "crypto";
import * as dotenv from "dotenv";
import { generateDiagnosticResponse } from "./lib/diagnostic-mock-data";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COMPANY_NAME = "Empresa Teste Diagnóstico";
const RESPONSES_COUNT = 45;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

function generatePublicToken(companySlug: string): string {
  const randomPart = randomBytes(8).toString("hex");
  return `${companySlug}-${randomPart}`;
}

async function main() {
  let company = await prisma.company.findFirst({
    where: { name: COMPANY_NAME },
  });

  if (!company) {
    const slug = generateSlug(COMPANY_NAME);
    const existingSlug = await prisma.company.findUnique({
      where: { slug },
    });
    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;
    company = await prisma.company.create({
      data: {
        name: COMPANY_NAME,
        slug: finalSlug,
        onboardingStatus: "NOVO",
      },
    });
    console.log(`Empresa criada: ${company.name} (id: ${company.id})`);
  } else {
    console.log(`Empresa já existe: ${company.name} (id: ${company.id})`);
  }

  const sentBy = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (!sentBy) {
    throw new Error("Nenhum usuário ADMIN encontrado. Crie um no banco para sentById do diagnóstico.");
  }

  const companySlug = company.slug ?? generateSlug(company.name);
  const publicToken = generatePublicToken(companySlug);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const diagnostic = await prisma.diagnosticForm.create({
    data: {
      companyId: company.id,
      sentById: sentBy.id,
      status: "PENDING",
      publicToken,
      expiresAt,
      targetAudience: "ALL",
    },
  });
  console.log(`Diagnóstico criado: id ${diagnostic.id}, token: ${publicToken}`);

  for (let i = 0; i < RESPONSES_COUNT; i++) {
    const data = generateDiagnosticResponse(i);
    await prisma.diagnosticResponse.create({
      data: {
        diagnosticId: diagnostic.id,
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName,
        position: data.position,
        area: data.area,
        timeInCompany: data.timeInCompany,
        directlyInvolved: data.directlyInvolved,
        directManager: data.directManager,
        topFiveTasks: data.topFiveTasks,
        topTwoTimeTasks: data.topTwoTimeTasks,
        copyPasteTask: data.copyPasteTask,
        reworkArea: data.reworkArea,
        humanErrorArea: data.humanErrorArea,
        dependencyArea: data.dependencyArea,
        frustration: data.frustration,
        taskDetails: data.taskDetails as object,
        systemsData: data.systemsData as object,
        priorityData: data.priorityData as object,
        completedAt: new Date(),
      },
    });
    console.log(`  Resposta ${i + 1}/${RESPONSES_COUNT}: ${data.fullName} (${data.area})`);
  }

  await prisma.diagnosticForm.update({
    where: { id: diagnostic.id },
    data: { status: "IN_PROGRESS" },
  });
  console.log(`\nConcluído: empresa "${COMPANY_NAME}", diagnóstico com ${RESPONSES_COUNT} respostas. Token: ${publicToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
