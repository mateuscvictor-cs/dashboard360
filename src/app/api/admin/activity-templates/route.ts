import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { templateService } from "@/services";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const templates = await templateService.findAll();
    return NextResponse.json(templates);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw error;
  }
}
