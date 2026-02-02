import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { csOwnerService } from "@/services";

export async function GET() {
  try {
    await requireRole(["ADMIN", "CS_OWNER"]);
    const csOwners = await csOwnerService.findAllWithMetrics();
    return NextResponse.json(csOwners);
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    throw error;
  }
}
