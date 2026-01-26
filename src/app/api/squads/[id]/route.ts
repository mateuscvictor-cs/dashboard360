import { NextRequest, NextResponse } from "next/server";
import { squadService } from "@/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const squad = await squadService.findById(id);
  
  if (!squad) {
    return NextResponse.json({ error: "Squad not found" }, { status: 404 });
  }
  
  return NextResponse.json(squad);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const squad = await squadService.update(id, body);
  return NextResponse.json(squad);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await squadService.delete(id);
  return NextResponse.json({ success: true });
}
