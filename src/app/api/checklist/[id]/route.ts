import { NextRequest, NextResponse } from "next/server";
import { checklistService } from "@/services";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const item = await checklistService.update(id, body);
  return NextResponse.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await checklistService.delete(id);
  return NextResponse.json({ success: true });
}
