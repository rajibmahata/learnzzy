import { getDb, newId } from "@/db/mongodb";
import { getLearner } from "@/repositories/learners";
import {
  crossedMilestone,
  resolveStickerIds,
  selectUnownedSticker,
  type Milestone,
  type StickerDef,
} from "@/lib/stickers";

// Server-authoritative unique sticker rewards (REWARD_SYSTEM.md).
// The server — never the browser — chooses which sticker a learner gets.
// Stars live on the progress path (recordGameResult); this module owns ONLY
// sticker uniqueness + claim idempotency, so stars can never double-count.

export interface RewardClaimDoc {
  claimId: string;
  learnerId: string;
  gameId: string;
  stickerId: string | null;
  accuracy?: number;
  milestone: Milestone | null;
  collectionComplete: boolean;
  createdAt: Date;
}

export interface ClaimInput {
  learnerId: string;
  gameId: string;
  accuracy?: number;
  claimId?: string;
}

export type ClaimOutcome =
  | { offline: true }
  | { offline: false; notFound: true }
  | {
      offline: false;
      notFound: false;
      duplicate: boolean;
      claimId: string;
      sticker: StickerDef | null;
      stickerCount: number;
      catalogSize: number;
      milestone: Milestone | null;
      collectionComplete: boolean;
    };

export async function claimReward(input: ClaimInput): Promise<ClaimOutcome> {
  const db = await getDb().catch(() => null);
  if (!db) return { offline: true };
  const claims = db.collection<RewardClaimDoc>("rewardClaims");
  const claimId = input.claimId || newId("claim");

  const toOutcome = async (doc: RewardClaimDoc, duplicate: boolean): Promise<ClaimOutcome> => {
    const learner = await getLearner(input.learnerId);
    if (!learner) return { offline: false, notFound: true };
    const stickers = resolveStickerIds(learner.stickerIds ?? []);
    const { ACTIVE_STICKERS } = await import("@/lib/stickers");
    return {
      offline: false,
      notFound: false,
      duplicate,
      claimId: doc.claimId,
      sticker: doc.stickerId ? (stickers.find((s) => s.id === doc.stickerId) ?? null) : null,
      stickerCount: stickers.length,
      catalogSize: ACTIVE_STICKERS.length,
      milestone: doc.milestone,
      collectionComplete: doc.collectionComplete,
    };
  };

  const existing = await claims.findOne({ claimId }).catch(() => null);
  if (existing) return toOutcome(existing, true);

  const learner = await getLearner(input.learnerId);
  if (!learner) return { offline: false, notFound: true };
  const before = resolveStickerIds(learner.stickerIds ?? []).length;
  const ownedIds = learner.stickerIds ?? [];
  const pick = selectUnownedSticker(ownedIds, `${input.learnerId}:${claimId}`);

  if (pick) {
    // $addToSet is the final uniqueness guard: concurrent claims can pick the
    // same sticker, but the collection can never hold it twice.
    await db
      .collection("learners")
      .updateOne({ learnerId: input.learnerId }, { $addToSet: { stickerIds: pick.id } as never })
      .catch(() => null);
  }
  const afterLearner = await getLearner(input.learnerId);
  const after = resolveStickerIds(afterLearner?.stickerIds ?? []).length;
  const milestone = crossedMilestone(before, after);
  const doc: RewardClaimDoc = {
    claimId,
    learnerId: input.learnerId,
    gameId: input.gameId,
    stickerId: pick?.id ?? null,
    accuracy: input.accuracy,
    milestone,
    collectionComplete: pick === null,
    createdAt: new Date(),
  };
  try {
    await claims.insertOne(doc);
  } catch (err: unknown) {
    // Lost a claimId race: the winner's claim is the single source of truth.
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      const winner = await claims.findOne({ claimId }).catch(() => null);
      if (winner) return toOutcome(winner, true);
    }
  }
  return toOutcome(doc, false);
}
