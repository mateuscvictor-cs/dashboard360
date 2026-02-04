import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { templateService } from "@/services";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const appliedTemplates = await templateService.getAppliedTemplates();
    return NextResponse.json(appliedTemplates);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw error;
  }
}
