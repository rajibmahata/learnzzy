import { NextResponse } from "next/server";
import { currentAdmin } from "@/server/admin-auth";

export function requireAdmin():
  | { ok: true; admin: { id: string; email: string } }
  | { ok: false; response: NextResponse } {
  const admin = currentAdmin();
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin sign-in required." } },
        { status: 401 }
      ),
    };
  }
  return { ok: true, admin };
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}
