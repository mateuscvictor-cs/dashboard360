import { NextRequest, NextResponse } from "next/server";
import { squadService } from "@/services";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const member = await squadService.addMember(id, body.csOwnerId);
  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const csOwnerId = searchParams.get("csOwnerId");
  
  if (!csOwnerId) {
    return NextResponse.json({ error: "csOwnerId required" }, { status: 400 });
  }
  
  await squadService.removeMember(id, csOwnerId);
  return NextResponse.json({ success: true });
}
