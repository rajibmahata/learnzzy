import { NextResponse } from "next/server";
import { listLevels } from "@/repositories/levels";

export async function GET() {
  const levels = await listLevels();
  return NextResponse.json({ success: true, data: levels });
}
