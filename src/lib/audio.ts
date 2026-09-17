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
  try {
    if (!audioAvailable()) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 200));
    utter.lang = lang;
    utter.rate = 0.9;
    utter.pitch = 1.1;
    synth.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  try {
    if (audioAvailable()) window.speechSynthesis.cancel();
  } catch {
    /* silent */
  }
}
