import { NextRequest, NextResponse } from "next/server";
import { checklistService } from "@/services";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await checklistService.toggleCompleted(id);
  return NextResponse.json(item);
}
