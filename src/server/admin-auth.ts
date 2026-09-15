import { scryptSync, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "lz_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface AdminIdentity {
  id: string;
  email: string;
}

function secret(): string {
  const s = process.env.ADMIN_AUTH_SECRET;
  if (!s) throw new Error("ADMIN_AUTH_SECRET is not configured");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function hashPassword(password: string): string {
  const salt = "learnzzy-admin-v1";
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, expected: string): boolean {
  try {
    const computed = hashPassword(password);
    const a = Buffer.from(computed);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function issueSession(admin: AdminIdentity): string {
  const payload = Buffer.from(
    JSON.stringify({ ...admin, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSession(token: string | undefined): AdminIdentity | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminIdentity & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, email: data.email };
  } catch {
    return null;
  }
}

export function currentAdmin(): AdminIdentity | null {
  try {
    return readSession(cookies().get(COOKIE)?.value);
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string): { name: string; value: string; opts: Record<string, unknown> } {
  return {
    name: COOKIE,
    value: token,
    opts: {
      httpOnly: true,
      sameSite: "lax" as const,
      // See parent-auth.ts: COOKIE_SECURE=false allows local Docker over HTTP.
      secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    },
  };
}

export function clearSessionCookie(): { name: string; value: string; opts: Record<string, unknown> } {
  return { name: COOKIE, value: "", opts: { httpOnly: true, path: "/", maxAge: 0 } };
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_AUTH_SECRET);
}
