import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetStatus() {
  const token = "empresa-teste-58b6ad2069ddbb46";
  
  const diagnostic = await prisma.diagnosticForm.findFirst({
    where: { publicToken: token },
  });
  
  if (!diagnostic) {
    console.log("Diagnóstico não encontrado");
    return;
  }
  
  console.log("Status atual:", diagnostic.status);
  
  await prisma.diagnosticForm.update({
    where: { id: diagnostic.id },
    data: { status: "IN_PROGRESS" },
  });
  
  console.log("Status atualizado para IN_PROGRESS");
  
  await prisma.$disconnect();
}

resetStatus();
