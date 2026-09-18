// Multi-character Voice Engine — calm warm female learning companion.
// All characters share the same calm, warm, friendly female quality: soft
// volume, moderate speed, clear articulation, natural pauses. Personality
// varies by learning role but voice quality stays: warm + friendly +
// comforting + encouraging. Never loud, never shouting, never high-pitch.
// Content is prepared per language (en/hi/bn/ta/te) — never live-translated
// during gameplay. Playback resolves via cached audio assets; text always
// works when audio is unavailable, and voice never blocks gameplay.

export type VoiceCharacterId = "teddy" | "bunny" | "owl" | "monkey" | "parrot";

export type VoiceEvent =
  | "game_intro"
  | "learning_intro"
  | "concept_introduction"
  | "instruction"
  | "hint"
  | "correct_answer"
  | "incorrect_answer"
  | "encouragement"
  | "level_up"
  | "reward"
  | "session_complete"
  // Calm spec aliases — same delivery, richer event model (§VOICE EVENT TYPES)
  | "intro"
  | "learn"
  | "demonstrate"
  | "question"
  | "thinking"
  | "gentle_retry"
  | "explanation"
  | "discovery"
  | "level_progress";

export type VoiceLocale = "en" | "hi" | "bn" | "ta" | "te";

export type VoiceEmotion = "warm" | "encouraging" | "curious" | "patient" | "positive" | "calm";
export type SpeakingRate = "moderate" | "soft-moderate" | "slow";
export type VolumeProfile = "soft" | "soft-medium" | "low-medium";

export interface VoiceScript {
  characterId: VoiceCharacterId;
  eventType: VoiceEvent;
  text: string;
  ageBand: "4-5" | "6-7" | "8-9";
  language: VoiceLocale;
  emotion: VoiceEmotion;
  speakingRate: SpeakingRate;
  volumeProfile: VolumeProfile;
  pauseAfterMs: number;
}

export interface VoiceCharacter {
  characterId: VoiceCharacterId;
  name: string;
  personality: string;
  speechStyle: string;
  language: VoiceLocale[];
  voice: { rate: number; pitch: number; lang: string };
}

export const VOICE_CHARACTERS: VoiceCharacter[] = [
  {
    characterId: "teddy",
    name: "Teddy",
    personality: "Warm math companion — patient, encouraging",
    speechStyle: "Warm, soft, moderate pace, clear pauses; calm female companion",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.82, pitch: 1.0, lang: "en-US" },
  },
  {
    characterId: "bunny",
    name: "Bunny",
    personality: "Gentle creative companion — soft, friendly",
    speechStyle: "Warm, soft, moderate pace, clear pauses; calm female companion",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.86, pitch: 1.05, lang: "en-US" },
  },
  {
    characterId: "owl",
    name: "Owl",
    personality: "Calm thinking companion — patient, curious",
    speechStyle: "Warm, soft, moderate pace, clear pauses; calm female companion",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.82, pitch: 0.97, lang: "en-US" },
  },
  {
    characterId: "monkey",
    name: "Monkey",
    personality: "Playful but controlled puzzle companion — calm, cheerful",
    speechStyle: "Warm, soft, moderate pace, clear pauses; calm female companion",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.88, pitch: 1.02, lang: "en-US" },
  },
  {
    characterId: "parrot",
    name: "Parrot",
    personality: "Clear language/phonics companion — patient, articulate",
    speechStyle: "Warm, soft, moderate pace, clear pauses; calm female companion",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.84, pitch: 1.03, lang: "en-US" },
  },
];

const CHARACTER_IDS: VoiceCharacterId[] = ["teddy", "bunny", "owl", "monkey", "parrot"];

export function getCharacter(id: string): VoiceCharacter {
  const found = VOICE_CHARACTERS.find((c) => c.characterId === id);
  return found ?? VOICE_CHARACTERS[0];
}

/** Deterministic character picker: stable per learner+concept, never random. */
export function pickCharacterFor(seedKey: string): VoiceCharacterId {
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return CHARACTER_IDS[(h >>> 0) % CHARACTER_IDS.length];
}

type ScriptTable = Partial<Record<VoiceEvent, string>>;

const EN: ScriptTable = {
  game_intro: "Hello. Shall we explore together?",
  intro: "Hello. Shall we explore together?",
  learning_intro: "Let's learn something new together.",
  learn: "Let's learn something new together.",
  concept_introduction: "Hello. I'm {name}. {fact}",
  instruction: "Take your time. Which one do you think is right?",
  question: "Take your time. Which one do you think is right?",
  hint: "Look carefully. {fact}",
  correct_answer: "Wonderful. You got it.",
  gentle_retry: "Not quite. Let's look carefully.",
  incorrect_answer: "Not quite. Let's look carefully.",
  encouragement: "Nice thinking.",
  explanation: "{fact}",
  discovery: "Wonderful. You noticed something new.",
  level_up: "Nice thinking. Ready for the next one?",
  level_progress: "Nice thinking. Ready for the next one?",
  reward: "You earned a {reward} sticker. Nice work.",
  session_complete: "You did well today. See you soon.",
  thinking: "Take your time. Look carefully.",
  demonstrate: "Let's try together. Watch first.",
};

const HI: ScriptTable = {
  game_intro: "नमस्ते। चलो साथ में देखें?",
  intro: "नमस्ते। चलो साथ में देखें?",
  learning_intro: "चलो मिलकर कुछ नया सीखें।",
  learn: "चलो मिलकर कुछ नया सीखें।",
  concept_introduction: "नमस्ते। मैं {name} हूँ। {fact}",
  instruction: "आराम से देखो। तुम्हें कौन सा सही लगता है?",
  question: "आराम से देखो। तुम्हें कौन सा सही लगता है?",
  hint: "ध्यान से देखो। {fact}",
  correct_answer: "बहुत अच्छे। तुमने सही किया।",
  gentle_retry: "थोड़ा और देखो। चलो ध्यान से देखें।",
  incorrect_answer: "थोड़ा और देखो। चलो ध्यान से देखें।",
  encouragement: "अच्छी सोच।",
  explanation: "{fact}",
  discovery: "बहुत सुंदर। तुमने कुछ नया देखा।",
  level_up: "अच्छी सोच। अगला देखें?",
  level_progress: "अच्छी सोच। अगला देखें?",
  reward: "तुम्हें {reward} स्टिकर मिला। शाबाश।",
  session_complete: "आज तुमने अच्छा सीखा। फिर मिलेंगे।",
  thinking: "आराम से देखो। ध्यान से सोचो।",
  demonstrate: "चलो साथ में करें। पहले देखो।",
};

const BN: ScriptTable = {
  game_intro: "হ্যালো। চলো একসাথে দেখি?",
  intro: "হ্যালো। চলো একসাথে দেখি?",
  learning_intro: "চলো একসাথে নতুন কিছু শিখি।",
  learn: "চলো একসাথে নতুন কিছু শিখি।",
  concept_introduction: "হ্যালো। আমি {name}। {fact}",
  instruction: "আস্তে দেখো। কোনটি ঠিক মনে হয়?",
  question: "আস্তে দেখো। কোনটি ঠিক মনে হয়?",
  hint: "মন দিয়ে দেখো। {fact}",
  correct_answer: "চমৎকার। তুমি পেরেছ।",
  gentle_retry: "আরেকবার দেখো। চলো মন দিয়ে দেখি।",
  incorrect_answer: "আরেকবার দেখো। চলো মন দিয়ে দেখি।",
  encouragement: "সুন্দর ভাবনা।",
  explanation: "{fact}",
  discovery: "চমৎকার। তুমি নতুন কিছু দেখেছ।",
  level_up: "সুন্দর ভাবনা। পরেরটি দেখি?",
  level_progress: "সুন্দর ভাবনা। পরেরটি দেখি?",
  reward: "তুমি {reward} স্টিকার পেয়েছ। ভালো করেছ।",
  session_complete: "আজ ভালো শিখেছ। আবার দেখা হবে।",
  thinking: "আস্তে দেখো। মন দিয়ে ভাবো।",
  demonstrate: "চলো একসাথে করি। প্রথমে দেখো।",
};

const TA: ScriptTable = {
  game_intro: "வணக்கம். சேர்ந்து பார்க்கலாமா?",
  intro: "வணக்கம். சேர்ந்து பார்க்கலாமா?",
  learning_intro: "வாருங்கள், ஒன்றாக புதிதாக கற்கலாம்.",
  learn: "வாருங்கள், ஒன்றாக புதிதாக கற்கலாம்.",
  concept_introduction: "வணக்கம். நான் {name}. {fact}",
  instruction: "நிதானமாகப் பார். எது சரி என்று நினைக்கிறாய்?",
  question: "நிதானமாகப் பார். எது சரி என்று நினைக்கிறாய்?",
  hint: "கவனமாகப் பார். {fact}",
  correct_answer: "அருமை. சரியாகச் செய்தாய்.",
  gentle_retry: "மீண்டும் பார். கவனமாகப் பார்க்கலாம்.",
  incorrect_answer: "மீண்டும் பார். கவனமாகப் பார்க்கலாம்.",
  encouragement: "நல்ல சிந்தனை.",
  explanation: "{fact}",
  discovery: "அருமை. புதிதாக ஒன்றை கவனித்தாய்.",
  level_up: "நல்ல சிந்தனை. அடுத்ததைப் பார்க்கலாமா?",
  level_progress: "நல்ல சிந்தனை. அடுத்ததைப் பார்க்கலாமா?",
  reward: "உனக்கு {reward} ஸ்டிக்கர் கிடைத்தது. நன்று.",
  session_complete: "இன்று நன்றாகக் கற்றாய். மீண்டும் சந்திப்போம்.",
  thinking: "நிதானமாகப் பார். கவனமாக யோசி.",
  demonstrate: "சேர்ந்து செய்யலாம். முதலில் பார்.",
};

const TE: ScriptTable = {
  game_intro: "హలో. కలిసి చూద్దామా?",
  intro: "హలో. కలిసి చూద్దామా?",
  learning_intro: "కలిసి కొత్తది నేర్చుకుందాం.",
  learn: "కలిసి కొత్తది నేర్చుకుందాం.",
  concept_introduction: "హలో. నేను {name}ని. {fact}",
  instruction: "నెమ్మదిగా చూడు. ఏది సరైనదనిపిస్తోంది?",
  question: "నెమ్మదిగా చూడు. ఏది సరైనదనిపిస్తోంది?",
  hint: "జాగ్రత్తగా చూడు. {fact}",
  correct_answer: "చాలా బాగుంది. నువ్వు సాధించావు.",
  gentle_retry: "మళ్ళీ చూడు. జాగ్రత్తగా చూద్దాం.",
  incorrect_answer: "మళ్ళీ చూడు. జాగ్రత్తగా చూద్దాం.",
  encouragement: "మంచి ఆలోచన.",
  explanation: "{fact}",
  discovery: "చాలా బాగుంది. కొత్తది గమనించావు.",
  level_up: "మంచి ఆలోచన. తర్వాతది చూద్దామా?",
  level_progress: "మంచి ఆలోచన. తర్వాతది చూద్దామా?",
  reward: "నీకు {reward} స్టికర్ వచ్చింది. బాగుంది.",
  session_complete: "ఈరోజు బాగా నేర్చుకున్నావు. మళ్ళీ కలుద్దాం.",
  thinking: "నెమ్మదిగా చూడు. జాగ్రత్తగా ఆలోచించు.",
  demonstrate: "కలిసి చేద్దాం. ముందు చూడు.",
};

const TABLES: Record<VoiceLocale, ScriptTable> = { en: EN, hi: HI, bn: BN, ta: TA, te: TE };

export const VOICE_LOCALES: VoiceLocale[] = ["en", "hi", "bn", "ta", "te"];

export function normalizeLocale(raw: string): VoiceLocale {
  const l = raw.toLowerCase().slice(0, 2);
  if (l === "hi" || l === "bn" || l === "ta" || l === "te") return l as VoiceLocale;
  return "en";
}

/** Calm voice script factory — reusable across TTS cache and lesson planning.
 * Fulfills §VOICE SCRIPT MODEL. Rate/volume/pause reflect the calm female
 * companion (moderate, soft, natural pauses). */
export function createVoiceScript(args: {
  characterId?: string;
  eventType: VoiceEvent;
  text?: string;
  ageBand?: "4-5" | "6-7" | "8-9";
  language?: string;
  emotion?: VoiceEmotion;
  speakingRate?: SpeakingRate;
  volumeProfile?: VolumeProfile;
  pauseAfterMs?: number;
}): VoiceScript {
  const locale = normalizeLocale(args.language ?? "en");
  const characterId = (args.characterId && (CHARACTER_IDS as string[]).includes(args.characterId) ? args.characterId : "teddy") as VoiceCharacterId;
  const fallback = scriptFor({ characterId, event: args.eventType, locale });
  const text = (args.text ?? fallback.text).slice(0, 200);
  return {
    characterId,
    eventType: args.eventType,
    text,
    ageBand: args.ageBand ?? "4-5",
    language: locale,
    emotion: args.emotion ?? "warm",
    speakingRate: args.speakingRate ?? "moderate",
    volumeProfile: args.volumeProfile ?? "soft",
    pauseAfterMs: typeof args.pauseAfterMs === "number" ? Math.max(0, Math.min(4000, args.pauseAfterMs)) : 800,
  };
}

/** Resolve a voice script with {name}/{fact}/{reward} interpolation. Falls back to English. */
export function scriptFor(args: {
  characterId?: string;
  event: VoiceEvent;
  locale?: string;
  name?: string;
  fact?: string;
  reward?: string;
}): { text: string; locale: VoiceLocale; characterId: VoiceCharacterId } {
  void args.characterId;
  const locale = normalizeLocale(args.locale ?? "en");
  const table = TABLES[locale] ?? EN;
  const template = table[args.event] ?? (EN[args.event] as string) ?? EN.instruction!;
  const text = template
    .replaceAll("{name}", (args.name ?? "friend").slice(0, 40))
    .replaceAll("{fact}", (args.fact ?? "").slice(0, 160))
    .replaceAll("{reward}", (args.reward ?? "Star").slice(0, 40))
    .slice(0, 200);
  const first = args.characterId && (CHARACTER_IDS as string[]).includes(args.characterId);
  return {
    text,
    locale,
    characterId: (first ? args.characterId : "teddy") as VoiceCharacterId,
  };
}

/** Deterministic cache key: character + event + locale + text hash. */
export function voiceCacheKey(characterId: string, event: VoiceEvent, locale: string, text: string): string {
  let h = 2166136261;
  const s = `${characterId}:${event}:${locale}:${text}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `voice:${characterId}:${event}:${normalizeLocale(locale)}:${(h >>> 0).toString(36)}`;
}

export function getVoiceProfile(characterId: string): { rate: number; pitch: number; lang: string } {
  return getCharacter(characterId).voice;
}

/** Parrot worked example (§6): full LEARN→REVIEW voice ladder, localized. */
export function parrotLadder(locale: string): { step: string; text: string }[] {
  const l = normalizeLocale(locale);
  const name = l === "hi" ? "तोता" : l === "bn" ? "টিয়া পাখি" : "Parrot";
  const birdWord = l === "hi" ? "तोते पक्षी हैं।" : l === "bn" ? "টিয়া পাখিরা পাখি।" : "Parrots are birds.";
  const table = TABLES[l];
  void table;
  return [
    { step: "show", text: scriptFor({ event: "concept_introduction", locale: l, name, fact: birdWord }).text },
    { step: "fact", text: birdWord },
    { step: "find", text: scriptFor({ event: "instruction", locale: l, name }).text },
    { step: "classify", text: scriptFor({ event: "instruction", locale: l, name: l === "en" ? "bird" : name }).text },
  ];
}

// Learning-first voice lines — calm teaching, not shouting.
// All lines are short, warm, with natural pause guidance.
// Callers speak them via lib/audio speakWithCharacter; text always works
// when audio is unavailable, and voice never blocks gameplay.

/** Learning-first praise: concept restated so the child hears the fact. */
export function learningPraise(kind: "addition" | "subtraction" | "discovery", detail: string): string {
  const d = detail.slice(0, 160);
  switch (kind) {
    case "addition":
      return `Wonderful. ${d} You figured it out.`.slice(0, 200);
    case "subtraction":
      return `Wonderful. ${d} You figured it out.`.slice(0, 200);
    case "discovery":
      return `You found it. Remember, ${d}`.slice(0, 200);
  }
}

/** Gentle retry line — never shames, always invites another look. */
export function gentleRetryLine(hint?: string): string {
  const h = (hint ?? "").slice(0, 120);
  return h ? `Not quite. Let's look carefully. ${h}`.slice(0, 200) : "Not quite. Let's look carefully.";
}

/** Calm thinking line — gives the child space before choices. */
export function thinkingLine(): string {
  return "Take your time. Look carefully.";
}

/** Warm teaching lines — DELIBERATELY calm, per voice spec. */
export function additionTeaching(a: number, b: number, total: number): string[] {
  return ["Let's put these together.", `How many are there now? ${total} is the answer.`];
}
export function subtractionTeaching(start: number, removed: number, left: number): string[] {
  return [`We have ${start} bears.`, `${removed} bears go away.`, `How many are left? ${left} are left.`];
}
export function orderingTeaching(): string {
  return "Look at the numbers. Which one comes first?";
}
export function tracingTeaching(): string {
  return "Follow the line slowly. You're doing it.";
}
