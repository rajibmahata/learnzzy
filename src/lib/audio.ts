"use client";

// Audio-first helpers — child-friendly learning companion.
// Young, soft, warm, playful — each companion has a distinct child-like
// voice, not a generic adult assistant. Never a live external TTS call;
// gameplay works offline and costs nothing. Voice never blocks gameplay;
// if audio unavailable, text continues silently. Varied sounds play
// alongside voice so the child feels "my friend is talking", not a TTS reader.
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
  return pickChildFriendlyVoice(lang, "teddy");
}

function pickChildFriendlyVoice(lang: string, characterId?: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const l = lang.toLowerCase();
    // Child-friendly: prefer actual child/young voices first, then warm female, then any
    const childHints = ["child", "young", "kid", "junior", "boy", "girl"];
    const femaleHints = ["female", "samantha", "karen", "moira", "tessa", "veena", "google uk english female", "microsoft zira", "microsoft hazel", "aria", "jenny", "emma"];
    // 1. Child voice for this character's language
    let best = voices.find((v) => v.lang.toLowerCase().startsWith(l.split("-")[0]) && childHints.some((h) => v.name.toLowerCase().includes(h)));
    if (best) return best;
    // 2. Any child voice
    best = voices.find((v) => childHints.some((h) => v.name.toLowerCase().includes(h)));
    if (best) return best;
    // 3. Companion-specific warm voice
    if (characterId) {
      const companionHints: Record<string, string[]> = {
        bunny: ["samantha", "karen", "moira"],
        fox: ["aria", "jenny"],
        panda: ["tessa", "veena"],
        teddy: ["samantha", "zira"],
        owl: ["hazel", "moira"],
        monkey: ["aria", "samantha"],
        elephant: ["zira", "hazel"],
        butterfly: ["jenny", "emma"],
        lion: ["david", "guy"],
        parrot: ["aria", "jenny"],
        puppy: ["samantha", "aria"],
        dino: ["david", "guy"],
      };
      const hints = companionHints[characterId] ?? femaleHints;
      best = voices.find((v) => v.lang.toLowerCase().startsWith(l.split("-")[0]) && hints.some((h) => v.name.toLowerCase().includes(h)));
      if (best) return best;
    }
    // 4. Warm female
    best = voices.find((v) => v.lang.toLowerCase().startsWith(l.split("-")[0]) && femaleHints.some((h) => v.name.toLowerCase().includes(h)));
    if (best) return best;
    best = voices.find((v) => v.lang.toLowerCase().startsWith("en") && v.name.toLowerCase().includes("female"));
    if (best) return best;
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

let audioContext: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext) {
      const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioContext = new Ctx();
    }
    return audioContext;
  } catch {
    return null;
  }
}

/** Play a short companion sound — chime, pop, twinkle — so the voice feels like a friend, not a TTS reader. */
export function playCompanionSound(characterId?: string, kind: "correct" | "encourage" | "celebrate" = "correct"): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Companion-specific base frequency — each friend has a distinct chime
    const baseFreq: Record<string, number> = {
      bunny: 880, fox: 740, panda: 659, teddy: 698, owl: 622, monkey: 784, elephant: 587, butterfly: 988, lion: 659, parrot: 831, puppy: 776, dino: 622,
    };
    const freq = baseFreq[characterId ?? "teddy"] ?? 700;
    if (kind === "correct") {
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (kind === "encourage") {
      osc.frequency.setValueAtTime(freq * 0.9, now);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.18);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.46);
    } else {
      // celebrate: two quick chimes
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setValueAtTime(freq * 1.25, now + 0.12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.10, now + 0.02);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.56);
      // second chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(freq * 1.5, now + 0.18);
      gain2.gain.setValueAtTime(0, now + 0.18);
      gain2.gain.linearRampToValueAtTime(0.09, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.50);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.51);
    }
  } catch {
    // Sound failure never blocks voice
  }
}

/** Calm character-aware speech: warm, soft, moderate, clear.
 * Respects mute, ensures child-friendly voice when available, gentle throttle for thinking time. */
export function speakWithCharacter(
  text: string,
  opts: { lang?: string; rate?: number; pitch?: number; characterId?: string } = {}
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
    // Play a gentle companion sound first so the child hears "my friend" before the words
    if (opts.characterId) {
      const kind = clean.toLowerCase().includes("not quite") || clean.toLowerCase().includes("try again") ? "encourage" : clean.toLowerCase().includes("wonderful") || clean.toLowerCase().includes("great job") ? "celebrate" : "correct";
      playCompanionSound(opts.characterId, kind as "correct" | "encourage" | "celebrate");
    }
    const utter = new SpeechSynthesisUtterance(clean);
    const lang = opts.lang ?? "en-US";
    utter.lang = lang;
    // Child-friendly: moderate rate (0.84–0.96), sweet pitch (1.08–1.22), never loud/fast
    utter.rate = Math.max(0.7, Math.min(1.05, opts.rate ?? 0.88));
    utter.pitch = Math.max(0.9, Math.min(1.35, opts.pitch ?? 1.12));
    utter.volume = 0.82; // soft, gentle for children
    const voice = cachedFemaleVoice ?? pickChildFriendlyVoice(lang, opts.characterId);
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

/** Child-friendly fantasy companion voice profiles — youthful, warm, soft, magical.
 * Each friend has a distinct child-like fantasy voice, not a generic adult assistant.
 * All are still soft and clear (never loud, never game-show), but now varied with
 * fantasy sparkle: higher pitch (1.10–1.28) with gentle breath and natural pauses,
 * plus a hint of magic. Each companion's voice feels like a young friend talking. */
export const CHARACTER_VOICES: Record<string, { rate: number; pitch: number }> = {
  // Teddy: warm cuddly bear — softest, most comforting, slightly slow, with a gentle hum
  teddy: { rate: 0.86, pitch: 1.14 },
  // Bunny: sweet gentle hop — light and airy, with a soft giggle
  bunny: { rate: 0.90, pitch: 1.22 },
  // Owl: wise but playful — calm but with a hint of curiosity, slightly breathy
  owl: { rate: 0.84, pitch: 1.10 },
  // Monkey: bouncy playful — most energetic, with a playful bounce
  monkey: { rate: 0.94, pitch: 1.18 },
  // Parrot: bright articulate — clear for phonics, cheerful with a sing-song
  parrot: { rate: 0.92, pitch: 1.16 },
  // Puppy: happy helper — warm and eager, with a happy pant
  puppy: { rate: 0.90, pitch: 1.18 },
  // Dino: gentle giant — warm and steady, slightly deeper but still child-like, with a soft rumble
  dino: { rate: 0.86, pitch: 1.12 },
  // Elephant: kind and slow — most deliberate, with a gentle trumpet
  elephant: { rate: 0.83, pitch: 1.10 },
  // Fox: bright clever — quick and light, with a sly sparkle
  fox: { rate: 0.92, pitch: 1.18 },
  // Panda: cozy calm — softest and slowest, with a cozy hum
  panda: { rate: 0.82, pitch: 1.12 },
  // Butterfly: airy light — highest and most playful, with a flutter
  butterfly: { rate: 0.94, pitch: 1.26 },
  // Lion: brave warm — steady and confident, with a soft roar
  lion: { rate: 0.88, pitch: 1.13 },
};

export type CompanionVoiceProfile = "bunny_child" | "fox_child" | "panda_child" | "teddy_child" | "owl_child" | "monkey_child" | "elephant_child" | "butterfly_child" | "lion_child" | "parrot_child" | "puppy_child" | "dino_child";

const COMPANION_PROFILE_MAP: Record<string, CompanionVoiceProfile> = {
  bunny: "bunny_child",
  fox: "fox_child",
  panda: "panda_child",
  teddy: "teddy_child",
  owl: "owl_child",
  monkey: "monkey_child",
  elephant: "elephant_child",
  butterfly: "butterfly_child",
  lion: "lion_child",
  parrot: "parrot_child",
  puppy: "puppy_child",
  dino: "dino_child",
};

/** Safe voice lookup: unknown ids fall back to Teddy (never undefined). */
export function voiceFor(characterId: string | undefined | null): { rate: number; pitch: number } {
  if (characterId && Object.prototype.hasOwnProperty.call(CHARACTER_VOICES, characterId)) {
    return CHARACTER_VOICES[characterId]!;
  }
  return CHARACTER_VOICES.teddy!;
}

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
