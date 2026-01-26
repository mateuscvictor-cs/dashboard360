import { NextRequest, NextResponse } from "next/server";
import { demandService } from "@/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const demands = await demandService.getByCSOwner(id);
  return NextResponse.json(demands);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const demand = await demandService.create({
    ...body,
    assignedToId: id,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
  });
  
  return NextResponse.json(demand, { status: 201 });
}
