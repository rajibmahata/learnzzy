import { createHash, randomBytes } from "crypto";
import { getDb, newId } from "@/db/mongodb";

export interface ParentDoc {
  parentId: string;
  email: string;
  name?: string;
  passwordHash: string;
  status: "active" | "disabled";
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface ParentChildLink {
  parentId: string;
  learnerId: string;
  status: "pending" | "active" | "revoked";
  createdAt: Date;
  activatedAt: Date | null;
}

export interface PairingCode {
  codeHash: string;
  parentId: string;
  learnerId: string | null;
  status: "open" | "pending" | "consumed" | "expired";
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 120);
}

// 6-char human-friendly code (no 0/O/1/I/L). Displayed as XXX-XXX.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generatePairingCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export function hashCode(code: string): string {
  return createHash("sha256").update(`learnzzy-pairing-v1|${code.replace(/-/g, "").toUpperCase()}`).digest("hex");
}

export const PAIRING_TTL_MS = 15 * 60 * 1000;

export async function createParent(input: { email: string; name?: string; passwordHash: string }): Promise<ParentDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  const doc: ParentDoc = {
    parentId: newId("parent"),
    email: normalizeEmail(input.email),
    name: input.name?.trim().slice(0, 60) || undefined,
    passwordHash: input.passwordHash,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };
  try {
    await db.collection<ParentDoc>("parents").insertOne(doc);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) return null; // duplicate email
    return null;
  }
  return doc;
}

export async function getParentByEmail(email: string): Promise<ParentDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  return (await db.collection<ParentDoc>("parents").findOne({ email: normalizeEmail(email) }).catch(() => null)) as ParentDoc | null;
}

export async function getParent(parentId: string): Promise<ParentDoc | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  return (await db.collection<ParentDoc>("parents").findOne({ parentId }).catch(() => null)) as ParentDoc | null;
}

export async function touchParentLogin(parentId: string): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) return;
  await db.collection("parents").updateOne({ parentId }, { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }).catch(() => null);
}

export async function createPairingCode(parentId: string): Promise<{ code: string; expiresAt: Date } | null> {
  const db = await getDb().catch(() => null);
  if (!db) return null;
  for (let i = 0; i < 3; i++) {
    const code = generatePairingCode();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
    try {
      await db.collection<PairingCode>("pairingCodes").insertOne({
        codeHash: hashCode(code),
        parentId,
        learnerId: null,
        status: "open",
        createdAt: new Date(),
        expiresAt,
        usedAt: null,
      });
      return { code, expiresAt };
    } catch {
      continue; // hash collision — regenerate
    }
  }
  return null;
}

// Child confirms a code: open -> pending (bound to learnerId). Single-use
// enforced by atomic status transition; expired codes rejected.
export async function confirmPairingCode(code: string, learnerId: string): Promise<{ ok: boolean; reason?: string; parentId?: string }> {
  const db = await getDb().catch(() => null);
  if (!db) return { ok: false, reason: "unavailable" };
  const now = new Date();
  const res = await db
    .collection<PairingCode>("pairingCodes")
    .findOneAndUpdate(
      { codeHash: hashCode(code), status: "open", expiresAt: { $gt: now } },
      { $set: { status: "pending", learnerId, usedAt: now } },
      { returnDocument: "after" }
    )
    .catch(() => null);
  const doc = (res as unknown as PairingCode | null) ?? null;
  if (!doc) return { ok: false, reason: "invalid-or-expired" };
  // Create pending link (idempotent per parent+learner).
  await db
    .collection<ParentChildLink>("parentChildLinks")
    .updateOne(
      { parentId: doc.parentId, learnerId },
      { $set: { status: "pending" }, $setOnInsert: { parentId: doc.parentId, learnerId, createdAt: now, activatedAt: null } },
      { upsert: true }
    )
    .catch(() => null);
  return { ok: true, parentId: doc.parentId };
}

export async function approvePairing(parentId: string, learnerId: string): Promise<boolean> {
  const db = await getDb().catch(() => null);
  if (!db) return false;
  const link = await db.collection<ParentChildLink>("parentChildLinks").findOne({ parentId, learnerId, status: "pending" }).catch(() => null);
  if (!link) return false;
  const now = new Date();
  await db.collection("parentChildLinks").updateOne({ parentId, learnerId }, { $set: { status: "active", activatedAt: now } }).catch(() => null);
  await db.collection("pairingCodes").updateMany({ parentId, learnerId, status: "pending" }, { $set: { status: "consumed" } }).catch(() => null);
  return true;
}

export async function revokeLink(parentId: string, learnerId: string): Promise<boolean> {
  const db = await getDb().catch(() => null);
  if (!db) return false;
  const r = await db.collection("parentChildLinks").updateOne({ parentId, learnerId, status: "active" }, { $set: { status: "revoked" } }).catch(() => null);
  return !!r && r.matchedCount > 0;
}

export async function listLinksForParent(parentId: string): Promise<ParentChildLink[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  return (await db.collection<ParentChildLink>("parentChildLinks").find({ parentId }).sort({ createdAt: -1 }).toArray().catch(() => [])) as ParentChildLink[];
}

// Server-side authorization: parent may access learner ONLY with active link.
export async function canParentAccessLearner(parentId: string, learnerId: string): Promise<boolean> {
  const db = await getDb().catch(() => null);
  if (!db) return false;
  const link = await db.collection("parentChildLinks").findOne({ parentId, learnerId, status: "active" }).catch(() => null);
  return !!link;
}

export async function pendingPairings(parentId: string): Promise<{ learnerId: string; createdAt: Date }[]> {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  const links = await db.collection<ParentChildLink>("parentChildLinks").find({ parentId, status: "pending" }).toArray().catch(() => []);
  return (links as ParentChildLink[]).map((l) => ({ learnerId: l.learnerId, createdAt: l.createdAt }));
}
