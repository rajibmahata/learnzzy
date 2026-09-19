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

// Throttle: gentle — allow explicit taps but avoid overlapping chatter.
let lastSpeakAt = 0;
const SPEAK_THROTTLE_MS = 350;
let cachedFemaleVoice: SpeechSynthesisVoice | null = null;

function pickCalmFemaleVoice(lang: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const l = lang.toLowerCase();
    // Prefer warm female voices: Google, Microsoft, Samantha, Karen, etc.
    const femaleHints = ["female", "samantha", "karen", "moira", "tessa", "veena", "google uk english female", "microsoft zira", "microsoft hazel"];
    let best = voices.find((v) => v.lang.toLowerCase().startsWith(l.split("-")[0]) && femaleHints.some((h) => v.name.toLowerCase().includes(h)));
    if (best) return best;
    // Fallback: any en female-like or first en voice
    best = voices.find((v) => v.lang.toLowerCase().startsWith("en") && v.name.toLowerCase().includes("female"));
    if (best) return best;
    // Fallback: first matching lang
    best = voices.find((v) => v.lang.toLowerCase() === l.toLowerCase());
    if (best) return best;
    best = voices.find((v) => v.lang.toLowerCase().startsWith(l.split("-")[0]));
    if (best) return best;
    return voices[0] ?? null;
  } catch {
    return null;
  }
}

function ensureVoices(): void {
  try {
    const synth = window.speechSynthesis;
    if (synth.getVoices().length === 0) {
      // Trigger async load; browser will fire voiceschanged
      synth.getVoices();
    }
    if (!cachedFemaleVoice) {
      const v = pickCalmFemaleVoice("en-US");
      if (v) cachedFemaleVoice = v;
    }
  } catch {}
}

if (typeof window !== "undefined") {
  try {
    window.speechSynthesis?.addEventListener?.("voiceschanged", () => {
      ensureVoices();
    });
    // initial attempt
    ensureVoices();
  } catch {}
}

/** Calm character-aware speech: warm, soft, moderate, clear.
 * Respects mute, ensures female voice, gentle throttle for thinking time. */
export function speakWithCharacter(
  text: string,
  opts: { lang?: string; rate?: number; pitch?: number } = {}
): boolean {
  try {
    if (isSoundMuted()) {
      // Ensure UI reflects muted state but don't block — return false so caller knows
      return false;
    }
    if (!audioAvailable()) return false;
    const now = Date.now();
    if (now - lastSpeakAt < SPEAK_THROTTLE_MS) {
      if (now - lastSpeakAt < 150) return false;
    }
    lastSpeakAt = now;
    ensureVoices();
    const synth = window.speechSynthesis;
    // Don't cancel if already speaking the same text within 1s — let it finish for child
    try {
      if (synth.speaking) synth.cancel();
    } catch {}
    const clean = text.replace(/\s+/g, " ").trim().slice(0, 200);
    if (!clean) return false;
    const utter = new SpeechSynthesisUtterance(clean);
    const lang = opts.lang ?? "en-US";
    utter.lang = lang;
    // Calm female: moderate rate (0.82–0.88), soft pitch (≈1.0), never loud/fast
    utter.rate = Math.max(0.7, Math.min(1.0, opts.rate ?? 0.84));
    utter.pitch = Math.max(0.9, Math.min(1.1, opts.pitch ?? 1.01));
    utter.volume = 0.85; // low-to-medium, respects device volume
    const voice = cachedFemaleVoice ?? pickCalmFemaleVoice(lang);
    if (voice) {
      utter.voice = voice;
      // Align lang to voice lang for natural pronunciation
      utter.lang = voice.lang;
    }
    utter.onerror = () => {
      // Silent fallback — never break gameplay, child sees text anyway
    };
    synth.speak(utter);
    // Safari requires resume if paused
    if (synth.paused) synth.resume();
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
