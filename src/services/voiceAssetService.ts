import { getDb, newId } from "@/db/mongodb";
import { voiceCacheKey, normalizeLocale, getCharacter, type VoiceEvent } from "@/lib/voice";

// Voice asset cache — content preparation → voice script → TTS generation →
// object storage/CDN → cached playback. Gameplay resolves through this cache
// and NEVER calls an external TTS service inline: a cache miss returns the
// prepared script text for instant device speechSynthesis, while generation
// is queued as pipeline work (voiceAssets status=pending). Audio absence
// never blocks play — text always works.

export interface VoiceAssetRequest {
  characterId: string;
  event: VoiceEvent;
  locale?: string;
  text: string;
}

export interface VoiceAssetResolution {
  cacheKey: string;
  text: string;
  locale: string;
  characterId: string;
  rate: number;
  pitch: number;
  cached: boolean;
  audioUrl: string | null;
}

export async function resolveVoiceAsset(req: VoiceAssetRequest): Promise<VoiceAssetResolution> {
  const locale = normalizeLocale(req.locale ?? "en");
  const character = getCharacter(req.characterId);
  const text = req.text.slice(0, 200);
  const cacheKey = voiceCacheKey(character.characterId, req.event, locale, text);
  const db = await getDb().catch(() => null);
  if (!db) {
    return { cacheKey, text, locale, characterId: character.characterId, rate: character.voice.rate, pitch: character.voice.pitch, cached: false, audioUrl: null };
  }
  try {
    const existing = (await db.collection("voiceAssets").findOne({ cacheKey }).catch(() => null)) as { audioUrl?: string } | null;
    if (existing && existing.audioUrl) {
      return {
        cacheKey,
        text,
        locale,
        characterId: character.characterId,
        rate: character.voice.rate,
        pitch: character.voice.pitch,
        cached: true,
        audioUrl: existing.audioUrl,
      };
    }
    if (!existing) {
      await db
        .collection("voiceAssets")
        .insertOne({
          assetId: newId("voice"),
          cacheKey,
          characterId: character.characterId,
          event: req.event,
          locale,
          text,
          status: "pending",
          audioUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .catch(() => null);
    }
  } catch {
    // Cache failure never blocks gameplay.
  }
  return { cacheKey, text, locale, characterId: character.characterId, rate: character.voice.rate, pitch: character.voice.pitch, cached: false, audioUrl: null };
}

export async function listVoiceAssets(limit = 50) {
  const db = await getDb().catch(() => null);
  if (!db) return [];
  return db.collection("voiceAssets").find({}).sort({ updatedAt: -1 }).limit(Math.min(Math.max(limit, 1), 100)).toArray().catch(() => []);
}
