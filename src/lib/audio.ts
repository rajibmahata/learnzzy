"use client";

// Audio-first helpers for young learners. Uses the device's own speech
// synthesis — never a live external TTS call, so gameplay works offline and
// costs nothing. Every call is guarded: no voice support ⇒ silent no-op.

export function audioAvailable(): boolean {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  } catch {
    return false;
  }
}

/** Speak short text in the requested locale. Returns false when unavailable. */
export function speak(text: string, lang = "en-US"): boolean {
  return speakWithCharacter(text, { lang, rate: 0.9, pitch: 1.1 });
}

/** Character-aware speech: playful friend voice, instruction stays clear. */
export function speakWithCharacter(
  text: string,
  opts: { lang?: string; rate?: number; pitch?: number } = {}
): boolean {
  try {
    if (!audioAvailable()) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 200));
    utter.lang = opts.lang ?? "en-US";
    utter.rate = Math.max(0.5, Math.min(1.3, opts.rate ?? 0.9));
    utter.pitch = Math.max(0.5, Math.min(1.6, opts.pitch ?? 1.1));
    synth.speak(utter);
    return true;
  } catch {
    return false;
  }
}

/** Character voice presets (mirrors server VOICE_CHARACTERS, client-safe). */
export const CHARACTER_VOICES: Record<string, { rate: number; pitch: number }> = {
  teddy: { rate: 0.85, pitch: 1.0 },
  bunny: { rate: 1.0, pitch: 1.25 },
  owl: { rate: 0.8, pitch: 0.9 },
  monkey: { rate: 1.05, pitch: 1.15 },
  parrot: { rate: 0.95, pitch: 1.3 },
};

export function stopSpeaking(): void {
  try {
    if (audioAvailable()) window.speechSynthesis.cancel();
  } catch {
    /* silent */
  }
}
