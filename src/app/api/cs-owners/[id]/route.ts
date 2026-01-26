import { NextRequest, NextResponse } from "next/server";
import { csOwnerService } from "@/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const csOwner = await csOwnerService.getById(id);
  
  if (!csOwner) {
    return NextResponse.json({ error: "CS Owner not found" }, { status: 404 });
  }
  
  return NextResponse.json(csOwner);
}
