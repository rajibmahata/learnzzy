// Multi-character Voice Engine — deterministic, dependency-free, testable.
// Characters are playful friends, never distracting: the educational
// instruction always stays verbatim and first. All voice content is prepared
// per language (en/hi/bn/ta/te) — never live-translated during gameplay.
// Playback resolves via cached audio assets; text always works when audio is
// unavailable, and voice never blocks gameplay.

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
  | "session_complete";

export type VoiceLocale = "en" | "hi" | "bn" | "ta" | "te";

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
    personality: "Friendly, slow, encouraging",
    speechStyle: "Warm and slow, celebrates every try",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.85, pitch: 1.0, lang: "en-US" },
  },
  {
    characterId: "bunny",
    name: "Bunny",
    personality: "Energetic, playful",
    speechStyle: "Bouncy and cheerful, short sentences",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 1.0, pitch: 1.25, lang: "en-US" },
  },
  {
    characterId: "owl",
    name: "Owl",
    personality: "Calm, teacher-like",
    speechStyle: "Slow and clear, explains gently",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.8, pitch: 0.9, lang: "en-US" },
  },
  {
    characterId: "monkey",
    name: "Monkey",
    personality: "Funny, playful",
    speechStyle: "Silly and giggly, keeps it light",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 1.05, pitch: 1.15, lang: "en-US" },
  },
  {
    characterId: "parrot",
    name: "Parrot",
    personality: "Repeating, interactive",
    speechStyle: "Repeats key words, loves echo games",
    language: ["en", "hi", "bn", "ta", "te"],
    voice: { rate: 0.95, pitch: 1.3, lang: "en-US" },
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

type ScriptTable = Record<VoiceEvent, string>;

const EN: ScriptTable = {
  game_intro: "Hello little explorer! Ready?",
  learning_intro: "Let's learn something new together!",
  concept_introduction: "Hello! I'm a {name}! {fact}",
  instruction: "Can you find the {name}?",
  hint: "Look closely — {fact}",
  correct_answer: "Yay! You got it!",
  incorrect_answer: "Oops! Let's look again together.",
  encouragement: "You're doing great! Keep going!",
  level_up: "Wow! You're ready for a new challenge!",
  reward: "You earned the {reward} sticker!",
  session_complete: "Amazing learning today! See you soon!",
};

const HI: ScriptTable = {
  game_intro: "नमस्ते छोटे खोजकर्ता! तैयार हो?",
  learning_intro: "चलो मिलकर कुछ नया सीखें!",
  concept_introduction: "नमस्ते! मैं एक {name} हूँ! {fact}",
  instruction: "क्या तुम {name} को ढूँढ सकते हो?",
  hint: "ध्यान से देखो — {fact}",
  correct_answer: "वाह! तुमने कर दिखाया!",
  incorrect_answer: "अरे! चलो मिलकर फिर से देखें।",
  encouragement: "तुम बहुत अच्छा कर रहे हो!",
  level_up: "वाह! तुम नई चुनौती के लिए तैयार हो!",
  reward: "तुमने {reward} स्टिकर जीता!",
  session_complete: "आज बहुत अच्छा सीखा! फिर मिलेंगे!",
};

const BN: ScriptTable = {
  game_intro: "হ্যালো ছোট্ট অভিযাত্রী! প্রস্তুত?",
  learning_intro: "চলো একসাথে নতুন কিছু শিখি!",
  concept_introduction: "হ্যালো! আমি একটি {name}! {fact}",
  instruction: "তুমি কি {name} খুঁজে পাবে?",
  hint: "ভালো করে দেখো — {fact}",
  correct_answer: "ইয়ে! তুমি পেরেছ!",
  incorrect_answer: "উপস! চলো আবার একসাথে দেখি।",
  encouragement: "তুমি দারুণ করছ!",
  level_up: "বাহ! তুমি নতুন চ্যালেঞ্জের জন্য প্রস্তুত!",
  reward: "তুমি {reward} স্টিকার পেয়েছ!",
  session_complete: "আজ দারুণ শিখেছ! আবার দেখা হবে!",
};

const TA: ScriptTable = {
  game_intro: "வணக்கம் சின்ன ஆராய்ச்சியாளரே! தயாரா?",
  learning_intro: "வாருங்கள் ஒன்றாக புதிதாக கற்கலாம்!",
  concept_introduction: "வணக்கம்! நான் ஒரு {name}! {fact}",
  instruction: "{name}-ஐ கண்டுபிடிக்க முடியுமா?",
  hint: "உற்றுப் பார் — {fact}",
  correct_answer: "ஆகா! நீ சரியாக செய்தாய்!",
  incorrect_answer: "ஓ! வா மீண்டும் சேர்ந்து பார்க்கலாம்.",
  encouragement: "நீ அருமையாக செய்கிறாய்!",
  level_up: "ஆகா! புதிய சவாலுக்கு தயார்!",
  reward: "நீ {reward} ஸ்டிக்கர் வென்றாய்!",
  session_complete: "இன்று அருமையாக கற்றாய்! மீண்டும் சந்திப்போம்!",
};

const TE: ScriptTable = {
  game_intro: "హలో చిన్న అన్వేషకుడా! సిద్ధమా?",
  learning_intro: "కలిసి కొత్తది నేర్చుకుందాం!",
  concept_introduction: "హలో! నేను ఒక {name}! {fact}",
  instruction: "నువ్వు {name} ను కనుగొనగలవా?",
  hint: "జాగ్రత్తగా చూడు — {fact}",
  correct_answer: "యే! నువ్వు సాధించావు!",
  incorrect_answer: "అయ్యో! కలిసి మళ్ళీ చూద్దాం.",
  encouragement: "నువ్వు చాలా బాగా చేస్తున్నావు!",
  level_up: "వావ్! కొత్త సవాలుకు సిద్ధం!",
  reward: "నువ్వు {reward} స్టికర్ గెలుచుకున్నావు!",
  session_complete: "ఈరోజు అద్భుతంగా నేర్చుకున్నావు! మళ్ళీ కలుద్దాం!",
};

const TABLES: Record<VoiceLocale, ScriptTable> = { en: EN, hi: HI, bn: BN, ta: TA, te: TE };

export const VOICE_LOCALES: VoiceLocale[] = ["en", "hi", "bn", "ta", "te"];

export function normalizeLocale(raw: string): VoiceLocale {
  const l = raw.toLowerCase().slice(0, 2);
  if (l === "hi" || l === "bn" || l === "ta" || l === "te") return l as VoiceLocale;
  return "en";
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
  const template = table[args.event] ?? EN[args.event];
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
