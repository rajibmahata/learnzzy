import { scryptSync, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { canParentAccessLearner, getParent } from "@/repositories/parents";

const COOKIE = "lz_parent";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — family device friendly
const SALT = "learnzzy-parent-v1"; // distinct salt from admin (no cross-use)

export interface ParentIdentity {
  id: string;
  email: string;
}

function secret(): string {
  // Reuse the admin secret infra when present; fall back to its own env.
  const s = process.env.PARENT_AUTH_SECRET || process.env.ADMIN_AUTH_SECRET;
  if (!s) throw new Error("PARENT_AUTH_SECRET (or ADMIN_AUTH_SECRET) is not configured");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function hashParentPassword(password: string): string {
  // ':' delimiters (never '$') — same env-interpolation reason as admin-auth.
  return `scrypt:${SALT}:${scryptSync(password, SALT, 64).toString("hex")}`;
}

export function verifyParentPassword(password: string, expected: string): boolean {
  try {
    const computed = hashParentPassword(password);
    const a = Buffer.from(computed);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function issueParentSession(parent: ParentIdentity): string {
  const payload = Buffer.from(JSON.stringify({ ...parent, exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readParentSession(token: string | undefined): ParentIdentity | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ParentIdentity & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, email: data.email };
  } catch {
    return null;
  }
}

export function currentParent(): ParentIdentity | null {
  try {
    return readParentSession(cookies().get(COOKIE)?.value);
  } catch {
    return null;
  }
}

export function setParentSessionCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    opts: {
      httpOnly: true,
      sameSite: "lax" as const,
      // Secure cookies require HTTPS. Local Docker runs plain HTTP, so the
      // base compose sets COOKIE_SECURE=false; production (TLS) leaves the
      // default, keeping cookies Secure.
      secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    },
  };
}

export function clearParentSessionCookie() {
  return { name: COOKIE, value: "", opts: { httpOnly: true, path: "/", maxAge: 0 } };
}

export function requireParent():
  | { ok: true; parent: ParentIdentity }
  | { ok: false; response: NextResponse } {
  const parent = currentParent();
  if (!parent) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Parent sign-in required." } },
        { status: 401 }
      ),
    };
  }
  return { ok: true, parent };
}

// Authorize parent -> learner access. Returns the learner on success.
export async function requireParentChild(
  parentId: string,
  learnerId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const parent = await getParent(parentId).catch(() => null);
  if (!parent || parent.status !== "active") {
    return { ok: false, response: NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Account unavailable." } }, { status: 403 }) };
  }
  const allowed = await canParentAccessLearner(parentId, learnerId);
  if (!allowed) {
    return { ok: false, response: NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "No access to this learner." } }, { status: 403 }) };
  }
  return { ok: true };
}
