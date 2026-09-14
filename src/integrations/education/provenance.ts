import type { Provenance, ProviderName } from "./types";

// Provenance builder + license gate. Every external knowledge record must
// carry provider/source/license/attribution/timestamps. Only licenses in the
// allowlist may enter the production content pool; everything else stays
// advisory (planner hints, parent summaries) or rejected.

// Commercially redistributable with attribution.
const POOL_SAFE_LICENSES = new Set([
  "cc-by",
  "cc-by-sa",
  "cc0",
  "public-domain",
  "mit",
  "learnzzy-native",
]);

function normalizeLicense(license: string): string {
  return license.trim().toLowerCase().replace(/^cc\s+/, "cc-").replace(/\s+/g, "-");
}

export function buildProvenance(args: {
  provider: ProviderName | "learnzzy-native";
  sourceId: string;
  license: string;
  attribution: string;
  reference?: string;
  ttlSeconds?: number;
}): Provenance {
  const now = new Date();
  const retrievedAt = now.toISOString();
  const expiresAt = args.ttlSeconds ? new Date(now.getTime() + args.ttlSeconds * 1000).toISOString() : undefined;
  return {
    provider: args.provider,
    sourceId: args.sourceId.slice(0, 200),
    reference: args.reference?.slice(0, 500),
    license: args.license.slice(0, 120),
    attribution: args.attribution.slice(0, 500),
    retrievedAt,
    expiresAt,
  };
}

export function isPoolSafeLicense(license: string): boolean {
  return POOL_SAFE_LICENSES.has(normalizeLicense(license));
}

// Explicitly non-redistributable families stay out of the pool.
export function isBlockedLicense(license: string): boolean {
  const n = normalizeLicense(license);
  return n.includes("nc") || n.includes("non-commercial") || n.includes("college-board") || n.includes("state-copyright");
}
