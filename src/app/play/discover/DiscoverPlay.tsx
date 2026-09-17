"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { Celebration } from "@/components/child/Celebration";
import { Button } from "@/components/ui/Button";
import {
  buildQuizOptions,
  pickDiscoverSet,
  type KnowledgeConcept,
} from "@/lib/knowledge";
import { speak as speakAudio } from "@/lib/audio";
import { getWindowSeed, shuffleWithSeed } from "@/lib/windowSeed";
import { getCachedProfile } from "@/lib/learner";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";

type Step =
  | { type: "learn"; concept: KnowledgeConcept }
  | { type: "recognize"; concept: KnowledgeConcept; options: KnowledgeConcept[] }
  | { type: "find"; concept: KnowledgeConcept; grid: KnowledgeConcept[]; need: number };

const RECENT_KEY = "learnzzy.recentConcepts.v1";

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function maxLevelFor(ageBand?: string): 1 | 2 | 3 {
  if (ageBand === "4-5") return 1;
  if (ageBand === "8-9") return 3;
  return 2;
}

export default function DiscoverPlay() {
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [done, setDone] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [feedback, setFeedback] = React.useState<"idle" | "correct" | "retry">("idle");
  const [hintOpen, setHintOpen] = React.useState(false);
  const [found, setFound] = React.useState<string[]>([]);
  const mistakeSteps = React.useRef<Set<number>>(new Set());
  const hintOpens = React.useRef(0);
  const gameStart = React.useRef(Date.now());
  const profile = React.useMemo(() => getCachedProfile(), []);
  const learnerId = profile?.learnerId;

  // One deterministic activity set per window: learn → recognize → find.
  const steps = React.useMemo<Step[]>(() => {
    const seed = getWindowSeed();
    const concepts = pickDiscoverSet(seed, 3, readRecent(), maxLevelFor(profile?.ageBand));
    const out: Step[] = [];
    concepts.forEach((concept, i) => out.push({ type: "learn", concept }));
    const order = shuffleWithSeed(concepts, seed ^ 0x51ab);
    order.forEach((concept, i) => {
      const options = buildQuizOptions(concept, 3, seed ^ (i * 101 + 7));
      out.push({ type: "recognize", concept, options });
    });
    order.forEach((concept, i) => {
      const s = seed ^ (i * 917 + 13);
      const sameCat = concepts.filter((c) => c.id !== concept.id);
      const grid = shuffleWithSeed([concept, concept, ...sameCat, ...sameCat], s).slice(0, 6);
      out.push({ type: "find", concept, grid, need: 2 });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = steps[stepIdx];
  const totalQuiz = steps.filter((s) => s.type !== "learn").length;

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "discover", metadata: { sessionId: getSessionId() } });
  }, []);

  React.useEffect(() => {
    setFeedback("idle");
    setHintOpen(false);
    setFound([]);
  }, [stepIdx]);

  async function postConcept(conceptId: string, signal: "exposed" | "recognized", correct = true) {
    if (!learnerId) return;
    try {
      await fetch(`/api/learners/${learnerId}/concepts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conceptId, signal, correct }),
      });
    } catch {
      /* offline — local play continues, mastery syncs never blocks */
    }
  }

  function hear(text: string) {
    speakAudio(text);
  }

  function advance() {
    if (stepIdx + 1 >= steps.length) {
      const accuracy = totalQuiz === 0 ? 1 : Math.max(0, Math.min(1, (totalQuiz - mistakeSteps.current.size) / totalQuiz));
      const r = award("discover", 3);
      setReward(r);
      setDone(true);
      queueEvent({ event: "game_completed", gameId: "discover", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
      reportGameCompletion({ gameId: "discover", accuracy, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji, hintsUsed: hintOpens.current, durationMs: Date.now() - gameStart.current });
      try {
        const ids = steps.map((s) => s.concept.id);
        localStorage.setItem(RECENT_KEY, JSON.stringify([...readRecent(), ...ids].slice(-12)));
      } catch {}
      return;
    }
    setStepIdx(stepIdx + 1);
  }

  function answerQuiz(pickedId: string) {
    if (!step || step.type !== "recognize" || feedback === "correct") return;
    const ok = pickedId === step.concept.id;
    queueEvent({ event: "answer_submitted", gameId: "discover", contentId: step.concept.id, metadata: { answer: pickedId, correct: ok } });
    if (ok) {
      setFeedback("correct");
      queueEvent({ event: "answer_correct", gameId: "discover", contentId: step.concept.id });
      void postConcept(step.concept.id, "recognized", true);
      setTimeout(advance, 900);
    } else {
      setFeedback("retry");
      mistakeSteps.current.add(stepIdx);
      queueEvent({ event: "answer_incorrect", gameId: "discover", contentId: step.concept.id });
      void postConcept(step.concept.id, "recognized", false);
      setTimeout(() => setFeedback("idle"), 900);
    }
  }

  function tapFind(id: string) {
    if (!step || step.type !== "find" || feedback === "correct") return;
    if (id === step.concept.id) {
      const next = [...found, `${id}-${found.length}`];
      // Count taps on the target (duplicates in grid are separate instances).
      const hits = next.length;
      setFound(next);
      if (hits >= step.need) {
        setFeedback("correct");
        queueEvent({ event: "answer_correct", gameId: "discover", contentId: step.concept.id });
        void postConcept(step.concept.id, "recognized", true);
        setTimeout(advance, 900);
      }
    } else {
      setFeedback("retry");
      mistakeSteps.current.add(stepIdx);
      queueEvent({ event: "answer_incorrect", gameId: "discover", contentId: step.concept.id });
      void postConcept(step.concept.id, "recognized", false);
      setTimeout(() => setFeedback("idle"), 900);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration
          title="AMAZING!"
          stars={reward?.stars ?? 3}
          sticker={reward?.sticker ?? null}
          onReplay={() => {
            mistakeSteps.current.clear();
            setStepIdx(0);
            setFeedback("idle");
            setDone(false);
            setReward(null);
          }}
        />
      </div>
    );
  }

  if (!step) {
    return (
      <GameShell title="Discovery World" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Discovery World" stars={totalStars}>
      {step.type === "learn" && (
        <div className="mt-3 flex flex-col items-center text-center">
          <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Learn · {stepIdx + 1} of {steps.length}
          </p>
          <div aria-hidden className="mt-4 flex h-40 w-40 items-center justify-center rounded-3xl bg-white text-8xl shadow-card">
            {step.concept.emoji}
          </div>
          <h2 className="mt-3 text-headline-md">{step.concept.names.en}</h2>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => hear(`${step.concept.names.en}. ${step.concept.fact}`)}
              aria-label={`Hear about the ${step.concept.names.en}`}
              className="tactile min-h-12 rounded-full bg-primary-fixed px-5 text-sm font-black text-primary shadow-[0_4px_0_#adc6ff]"
            >
              🔊 Hear it
            </button>
          </div>
          <p className="mt-3 max-w-xs text-body-md text-on-surface-variant">{step.concept.fact}</p>
          <Button
            size="xl"
            className="mt-4 w-full max-w-xs"
            onClick={() => {
              void postConcept(step.concept.id, "exposed");
              queueEvent({ event: "question_shown", gameId: "discover", contentId: step.concept.id });
              advance();
            }}
          >
            Next →
          </Button>
        </div>
      )}

      {step.type === "recognize" && (
        <div className="mt-3 flex flex-col items-center text-center">
          <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Practice · {stepIdx + 1} of {steps.length}
          </p>
          <h2 className="mt-2 text-instruction">What is this?</h2>
          <button
            type="button"
            onClick={() => hear("What is this?")}
            aria-label="Hear the question"
            className="tactile mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-lg text-primary shadow-[0_2px_0_#d5e3fc]"
          >
            🔊
          </button>
          <div aria-hidden className="mt-3 flex h-32 w-32 items-center justify-center rounded-3xl bg-white text-7xl shadow-card">
            {step.concept.emoji}
          </div>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setHintOpen(true);
                hintOpens.current += 1;
                queueEvent({ event: "hint_used", gameId: "discover", contentId: step.concept.id });
              }}
              aria-label="Show a hint"
              aria-expanded={hintOpen}
              className="tactile min-h-12 rounded-full bg-secondary-fixed px-5 text-sm font-black text-on-secondary-fixed shadow-[0_4px_0_#ffb95f]"
            >
              ? Hint 💡
            </button>
          </div>
          {hintOpen && (
            <div role="dialog" aria-label="Hint" className="safe-panel mx-auto mt-2 w-full max-w-md p-4">
              <p className="text-sm font-black text-on-surface">💡 Hint</p>
              <p className="mt-1 text-sm text-on-surface-variant">{step.concept.fact}</p>
              <button
                type="button"
                onClick={() => setHintOpen(false)}
                aria-label="Close hint"
                className="tactile mt-3 min-h-12 w-full rounded-full bg-primary-container text-sm font-black text-white shadow-[0_4px_0_#004395]"
              >
                Got it!
              </button>
            </div>
          )}
          <div className="mt-3 grid w-full grid-cols-1 gap-2" role="group" aria-label="Answer choices">
            {step.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => answerQuiz(o.id)}
                aria-label={`Answer ${o.names.en}`}
                data-testid="discover-option"
                data-correct={o.id === step.concept.id ? "true" : "false"}
                className="tactile flex min-h-touch w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-answer shadow-[0_6px_0_#d5e3fc]"
              >
                {o.names.en}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mt-3 min-h-[1.75rem] text-center text-lg font-bold">
            {feedback === "correct" ? "✨ Great job!" : feedback === "retry" ? "Try again!" : ""}
          </p>
        </div>
      )}

      {step.type === "find" && (
        <div className="mt-3 flex flex-col items-center text-center">
          <p className="rounded-full bg-surface-high px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Find · {stepIdx + 1} of {steps.length}
          </p>
          <h2 className="mt-2 text-instruction">Find {step.need} {step.concept.names.en}s!</h2>
          <div className="mt-3 grid w-full grid-cols-3 gap-2" role="group" aria-label={`Find the ${step.concept.names.en}`}>
            {step.grid.map((g, i) => (
              <button
                key={`${g.id}-${i}`}
                type="button"
                onClick={() => tapFind(g.id)}
                aria-label={g.names.en}
                className="tactile flex min-h-touch flex-col items-center justify-center rounded-2xl border-2 border-transparent bg-white p-3 text-5xl shadow-card"
              >
                <span aria-hidden>{g.emoji}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm font-bold text-primary">
            {found.length >= step.need ? "✨ Found them all!" : `Found ${Math.min(found.length, step.need)} of ${step.need}`}
          </p>
          <p aria-live="polite" className="mt-1 min-h-[1.75rem] text-center text-lg font-bold">
            {feedback === "retry" ? "Try again!" : ""}
          </p>
        </div>
      )}
    </GameShell>
  );
}
