"use client";

import * as React from "react";
import Link from "next/link";
import { GameShell } from "@/components/child/GameShell";
import { CharacterGuide } from "@/components/child/CharacterGuide";
import { characterForGame } from "@/lib/characters";
import { normalizeAgeBand } from "@/lib/complexity";
import { activityFor } from "@/lib/activityRegistry";
import type { ActivityContent } from "@/lib/activityContent";
import { getCachedProfile, getLearnerId } from "@/lib/learner";
import { queueEvent, syncEvents } from "@/lib/events";
import { speakWithCharacter } from "@/lib/audio";

/**
 * Generic worksheet-inspired activity player (spec §6–§16).
 * Single-choice + trace-write kinds; calm, no timers; gentle hints that
 * teach thinking; completion reported via existing game-events (skill signal
 * flows to skillLevels → academic engine without new contracts).
 */
export function ActivityPlayer({ activityId }: { activityId: string }) {
  const def = activityFor(activityId);
  const [items, setItems] = React.useState<ActivityContent[]>([]);
  const [index, setIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [hint, setHint] = React.useState(0);
  const [hintsUsed, setHintsUsed] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const startedAt = React.useRef(Date.now());

  const profile = getCachedProfile();
  const ageBand = normalizeAgeBand(profile?.ageBand);
  // Purposeful guide per category (spec §4/§34): Teddy → numbers,
  // Parrot → words/discover, Bunny → write/create, Owl → think/shapes,
  // Monkey → puzzles. characterForGame maps those engines to friends.
  const categoryGame =
    def?.category === "numbers" ? "addition"
    : def?.category === "words" ? "discover"
    : def?.category === "write" ? "sketch"
    : def?.category === "think" ? "clean-up"
    : def?.category === "shapes" ? "puzzle"
    : def?.category === "puzzles" ? "puzzle"
    : "discover";
  const character = characterForGame(categoryGame);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const learnerId = getLearnerId();
        const params = new URLSearchParams({
          ageBand, limit: "5", seed: `${learnerId ?? "guest"}-${Date.now() % 100000}`,
        });
        if (learnerId) params.set("learnerId", learnerId);
        const res = await fetch(`/api/activities/${activityId}/content?${params}`, { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length > 0) setItems(data.items);
      } catch {
        // offline: player shows friendly retry (never blank)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  if (!def) {
    return (
      <GameShell title="Learnzzy" stars={0}>
        <p className="mt-10 text-center">Unknown activity. <Link href="/play" className="underline">Back home</Link></p>
      </GameShell>
    );
  }

  const current = items[index];
  const feedback = picked == null ? "idle" : picked === current?.answer ? "correct" : "retry";

  function answer(option: string) {
    if (!current || picked != null) return;
    setPicked(option);
    setAttempts((a) => a + 1);
    const ok = option === current.answer;
    if (ok) setCorrect((c) => c + 1);
    queueEvent({
      gameId: activityId,
      event: ok ? "answer_correct" : "answer_incorrect",
      contentId: current.contentId,
      metadata: { skill: current.skill, ageBand, hintsUsed },
    });
    syncEvents().catch(() => {});
    if (ok) speakWithCharacter(current.explanation, { lang: "en-US" });
  }

  function next() {
    if (index + 1 >= items.length) {
      const accuracy = attempts > 0 ? correct / Math.max(1, attempts) : 0;
      queueEvent({
        gameId: activityId,
        event: "game_completed",
        metadata: {
          contentIds: items.map((i) => i.contentId), accuracy, attempts,
          hintsUsed, durationMs: Date.now() - startedAt.current, ageBand,
        },
      });
      syncEvents().catch(() => {});
      // Academic/skill loop (best-effort, never blocks the child).
      const learnerId = getLearnerId();
      if (learnerId) {
        fetch(`/api/learners/${learnerId}/academic/result`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ gameId: activityId, accuracy, attempts, hintsUsed, durationMs: Date.now() - startedAt.current }),
        }).catch(() => {});
      }
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
      setHint(0);
    }
  }

  return (
    <GameShell title={def.title} stars={correct}>
      <div className="mx-auto flex w-full max-w-game flex-col gap-3 px-4 pb-24 pt-4">
        <CharacterGuide
          character={character}
          state={done ? "celebrating" : feedback === "correct" ? "happy" : feedback === "retry" ? "encouraging" : "thinking"}
          line={done ? "Amazing! You finished!" : current?.instruction ?? def.blurb}
        />
        {loading ? (
          <div role="status" className="safe-panel p-8 text-center">Getting your activity ready… ✨</div>
        ) : !current ? (
          <div className="safe-panel p-8 text-center">
            <p className="text-headline-md">Hmm, the activity did not load.</p>
            <p className="text-on-surface-variant">Check your connection and try again — your stars are safe.</p>
            <button type="button" onClick={() => window.location.reload()} className="tactile-button mt-4 bg-primary px-6 py-3 text-white">Try again</button>
          </div>
        ) : done ? (
          <div className="safe-panel p-8 text-center">
            <p aria-hidden className="text-5xl">🌟</p>
            <h2 className="mt-2 text-headline-lg">Great job!</h2>
            <p className="text-on-surface-variant">{correct} of {items.length} — {hintsUsed === 0 ? "no hints needed!" : `${hintsUsed} hint${hintsUsed > 1 ? "s" : ""} used, good thinking!`}</p>
            <div className="mt-4 flex gap-2">
              <Link href="/play" className="tactile-button flex-1 bg-surface-high px-4 py-3 text-center">🏠 Home</Link>
              <button type="button" onClick={() => window.location.reload()} className="tactile-button flex-1 bg-primary px-4 py-3 text-white">Play again</button>
            </div>
          </div>
        ) : (
          <div className="safe-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{def.title} • {index + 1} of {items.length}</p>
            <h2 className="mt-1 text-headline-md">{current.prompt}</h2>
            <div aria-label={current.visualLabel} className="mt-3 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-surface-low p-4">
              {current.visual.map((v, i) => {
                // Big & Small: render actual size differences so maths is visible and correct
                if (current.templateId === "big-small" && current.visualMeta?.sizes) {
                  const sizes = current.visualMeta.sizes as number[];
                  const sizeIdx = sizes[i] ?? 0;
                  const n = sizes.length || 1;
                  // Age-graded subtlety: 4-5 obvious (wide range), 8-9 subtle (narrow range)
                  const isYoung = current.ageBand === "4-5";
                  const isMid = current.ageBand === "6-7";
                  const base = isYoung ? 0.7 : isMid ? 0.8 : 0.9;
                  const range = isYoung ? 1.1 : isMid ? 0.7 : 0.4;
                  const scale = n > 1 ? base + (sizeIdx / (n - 1)) * range : 1;
                  const fontSize = `${(1.4 + scale * 0.9).toFixed(2)}rem`; // 2.0rem → 3.0rem range
                  return (
                    <span
                      key={i}
                      aria-hidden
                      className="inline-flex items-center justify-center rounded-2xl bg-white px-2 py-1 shadow-sm border-2 border-surface-high"
                      style={{ fontSize, lineHeight: 1, minWidth: "3rem", minHeight: "3rem" }}
                      title={`Item ${i + 1}`}
                    >
                      {v}
                    </span>
                  );
                }
                return (
                  <span key={i} aria-hidden className="text-4xl">
                    {v}
                  </span>
                );
              })}
            </div>
            {current.templateId === "big-small" && (
              <div className="mt-2 flex justify-center gap-1 text-xs font-bold text-on-surface-variant">
                {current.visual.map((_, i) => (
                  <span key={i} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white border text-[11px] shadow-sm">
                    {i + 1}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {current.options.map((opt) => {
                const chosen = picked === opt;
                const isAnswer = opt === current.answer;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => answer(opt)}
                    disabled={picked != null}
                    aria-label={`Answer ${opt}`}
                    className={`tactile min-h-14 rounded-2xl px-4 py-3 text-answer shadow-[0_4px_0_#d5e3fc] ${
                      picked == null ? "bg-white" : chosen && isAnswer ? "bg-tertiary-fixed" : chosen ? "bg-error-container" : isAnswer ? "bg-tertiary-fixed/60" : "bg-white opacity-70"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked != null && (
              <p role="status" className="mt-3 text-center font-bold">
                {picked === current.answer ? `✅ ${current.explanation}` : "Not quite. Try the next one — look once more together! 💛"}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setHint((h) => Math.min(h + 1, current.hints.length)); setHintsUsed((h) => h + 1); }}
                className="tactile rounded-full bg-secondary-fixed px-4 py-2 text-sm font-bold"
              >
                💡 Hint{hint > 0 ? ` (${hint}/${current.hints.length})` : ""}
              </button>
              <button type="button" aria-label="Read aloud" onClick={() => speakWithCharacter(current.voiceLine, { lang: "en-US" })} className="tactile rounded-full bg-surface-high px-4 py-2 text-sm font-bold">🔊 Read aloud</button>
              {picked != null && (
                <button type="button" onClick={next} className="tactile-button ml-auto bg-primary px-6 py-2 text-white">
                  {index + 1 >= items.length ? "Finish 🎉" : "Next →"}
                </button>
              )}
            </div>
            {hint > 0 && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm">💡 {current.hints[hint - 1]}</p>}
          </div>
        )}
      </div>
    </GameShell>
  );
}
