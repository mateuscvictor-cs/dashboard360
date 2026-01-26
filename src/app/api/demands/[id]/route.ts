import { NextRequest, NextResponse } from "next/server";
import { demandService } from "@/services";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const demand = await demandService.update(id, {
    ...body,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
  });
  
  return NextResponse.json(demand);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await demandService.delete(id);
  return NextResponse.json({ success: true });
}
