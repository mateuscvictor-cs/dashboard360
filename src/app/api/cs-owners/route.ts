import { NextResponse } from "next/server";
import { csOwnerService } from "@/services";

export async function GET() {
  const csOwners = await csOwnerService.findAllWithMetrics();
  return NextResponse.json(csOwners);
}
