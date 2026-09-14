import { NextResponse } from "next/server";
import { currentAdmin } from "@/server/admin-auth";

export async function GET() {
  const admin = currentAdmin();
  return NextResponse.json({ success: true, data: { authenticated: Boolean(admin), admin } });
}
