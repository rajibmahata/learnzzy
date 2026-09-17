import { NextResponse } from "next/server";
import { z } from "zod";
import { getLearner } from "@/repositories/learners";
import { scriptFor, type VoiceEvent } from "@/lib/voice";
import { resolveVoiceAsset } from "@/services/voiceAssetService";
import { clientIp, takeAsync } from "@/lib/rate-limit";

// Voice resolve endpoint: prepared script → cached asset → instant playback.
// Never calls live TTS in the request path; text always returned so play
// continues when audio is unavailable. Voice never blocks gameplay.
const VoiceRequestSchema = z.object({
  event: z.enum([
    "game_intro",
    "learning_intro",
    "concept_introduction",
    "instruction",
    "hint",
    "correct_answer",
    "incorrect_answer",
    "encouragement",
    "level_up",
    "reward",
    "session_complete",
  ]),
  locale: z.string().min(2).max(10).default("en"),
  characterId: z.string().min(1).max(30).default("teddy"),
  name: z.string().max(40).optional(),
  fact: z.string().max(160).optional(),
  reward: z.string().max(40).optional(),
  text: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: { params: { learnerId: string } }) {
  const rl = await takeAsync(`learner:academic:voice:${clientIp(req)}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests." } }, { status: 429 });
  }
  const learner = await getLearner(params.learnerId);
  if (!learner) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Learner not found." } }, { status: 404 });
  const parsed = VoiceRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid voice request." } }, { status: 422 });
  }
  const { event, locale, characterId, name, fact, reward } = parsed.data;
  const script = scriptFor({ characterId, event: event as VoiceEvent, locale, name, fact, reward });
  const text = parsed.data.text?.slice(0, 200) ?? script.text;
  const asset = await resolveVoiceAsset({ characterId: script.characterId, event: event as VoiceEvent, locale: script.locale, text });
  return NextResponse.json({ success: true, data: asset }, { status: 200 });
}
