"use client";

// Audio-first helpers — calm warm female learning companion.
// Moderate speed, soft volume, clear articulation, natural pauses.
// Never a live external TTS call; gameplay works offline and costs nothing.
// Voice never blocks gameplay; if audio unavailable, text continues silently.
// Every call is guarded: no voice support ⇒ silent no-op.

export function audioAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  } catch {
    return false;
  }
}

/** Speak short text — calm companion defaults (moderate, soft). */
export function speak(text: string, lang = "en-US"): boolean {
  return speakWithCharacter(text, { lang, rate: 0.84, pitch: 1.01 });
}

// Throttle: give child thinking time — don't speak on every click.
// 900ms minimum gap; thinking/hint events bypass via `force` is not needed
// because callers already gate (ActivityPlayer waits 2–4s before hint voice).
let lastSpeakAt = 0;
const SPEAK_THROTTLE_MS = 900;

/** Calm character-aware speech: warm, soft, moderate, clear.
 * Respects mute, reduced-motion is handled by caller (no auto-play if needed),
 * and throttles rapid repeats so the child gets quiet thinking time. */
export function speakWithCharacter(
  text: string,
  opts: { lang?: string; rate?: number; pitch?: number } = {}
): boolean {
  try {
    if (isSoundMuted()) return false;
    if (!audioAvailable()) return false;
    const now = Date.now();
    if (now - lastSpeakAt < SPEAK_THROTTLE_MS) {
      // Allow immediate correct/gentle retry? Caller already throttles;
      // soft drop here ensures the child isn't talked over.
      // For now, respect throttle — next valid utterance will play.
      // To keep thinking time, we drop rather than queue.
      if (now - lastSpeakAt < 300) return false;
    }
    lastSpeakAt = now;
    const synth = window.speechSynthesis;
    synth.cancel();
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!clean) return false;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = opts.lang ?? "en-US";
    // Calm female: moderate rate (0.82–0.88), soft pitch (≈1.0), never loud/fast
    utter.rate = Math.max(0.7, Math.min(1.0, opts.rate ?? 0.84));
    utter.pitch = Math.max(0.9, Math.min(1.1, opts.pitch ?? 1.01));
    utter.volume = 0.85; // low-to-medium, respects device volume
    synth.speak(utter);
    return true;
  } catch {
    return false;
  }
}

/** Calm warm female learning companion presets — soft, moderate, clear.
 * All characters share the same calm female quality (warm + friendly +
 * moderate speed) with only subtle role variation; high pitch / fast rates
 * are never used. Mirrors server VOICE_CHARACTERS, client-safe. */
export const CHARACTER_VOICES: Record<string, { rate: number; pitch: number }> = {
  // Teddy: warm math companion — slowest, most comforting
  teddy: { rate: 0.82, pitch: 1.0 },
  // Bunny: gentle creative — soft lift, never bouncy
  bunny: { rate: 0.86, pitch: 1.05 },
  // Owl: calm thinking — clear and unhurried
  owl: { rate: 0.82, pitch: 0.97 },
  // Monkey: playful but controlled — moderate, not giggly
  monkey: { rate: 0.88, pitch: 1.02 },
  // Parrot: clear phonics — articulate, soft
  parrot: { rate: 0.84, pitch: 1.03 },
  // Puppy / Dino / Elephant: same calm family
  puppy: { rate: 0.85, pitch: 1.01 },
  dino: { rate: 0.83, pitch: 0.99 },
  elephant: { rate: 0.82, pitch: 0.98 },
};

const MUTE_KEY = "learnzzy.soundMuted.v1";

/** Persisted mute preference (§18). Default: sound on. Never throws. */
export function isSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted) stopSpeaking();
  } catch {
    /* silent */
  }
}

export function stopSpeaking(): void {
  try {
    if (audioAvailable()) window.speechSynthesis.cancel();
  } catch {
    /* silent */
  }
}
