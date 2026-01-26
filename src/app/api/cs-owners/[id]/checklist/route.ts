import { NextRequest, NextResponse } from "next/server";
import { checklistService } from "@/services";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const items = await checklistService.getByCSOwner(id);
  return NextResponse.json(items);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const item = await checklistService.create({
    ...body,
    csOwnerId: id,
    date: body.date ? new Date(body.date) : undefined,
  });
  
  return NextResponse.json(item, { status: 201 });
}
