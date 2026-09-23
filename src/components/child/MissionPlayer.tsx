"use client";

import * as React from "react";
import Link from "next/link";
import { GameShell } from "@/components/child/GameShell";
import { CharacterGuide } from "@/components/child/CharacterGuide";
import { ActivityRenderer } from "@/components/child/ActivityRenderer";
import { getCachedProfile, getLearnerId } from "@/lib/learner";
import { queueEvent, syncEvents } from "@/lib/events";
import { speakWithCharacter } from "@/lib/audio";
import { adoptServerSticker } from "@/lib/rewards";
import { WorldReward } from "@/components/child/WorldReward";
import { BalloonBurst } from "@/components/child/BalloonBurst";
import { RoundFeedback } from "@/components/child/WonderBits";
import { praiseFor, primaryCompanionId } from "@/lib/companion";
import { useRoundStatus } from "@/lib/useRoundStatus";
import type { Mission, MissionResponse } from "@/lib/missionEngine";

export function MissionPlayer({ missionId }: { missionId: string }) {
  let resolvedMissionId = missionId;
  try {
    resolvedMissionId = decodeURIComponent(missionId);
  } catch {
    // Keep the router value so the API returns its normal not-found response.
  }
  const [mission, setMission] = React.useState<Mission | null>(null);
  const [index, setIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<boolean | null>(null);
  const [hintsUsed, setHintsUsed] = React.useState(0);
  const [hintIndex, setHintIndex] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [earnedStars, setEarnedStars] = React.useState<number | null>(null);
  const [missionSticker, setMissionSticker] = React.useState<{ id: string; emoji: string; name: string } | null>(null);
  const [missionMilestone, setMissionMilestone] = React.useState<{ emoji: string; name: string; message: string } | null>(null);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const stepStartedAt = React.useRef(Date.now());
  const learnerId = getLearnerId() ?? "guest";
  const profile = getCachedProfile();
  // The child's primary companion leads missions (falls back to Parrot).
  const companion = primaryCompanionId(profile, "parrot");
  const current = mission?.steps[index];
  // Mission steps are manual-Next only (not auto-advancing); the shared
  // transition still owns feedback → Next so Next can never fire before it.
  const flow = useRoundStatus({
    gameId: mission?.gameType ?? "mission",
    roundIndex: index,
    totalRounds: mission?.steps.length ?? 3,
    contentId: current?.content?.contentId,
    autoAdvanceMs: null,
    onAdvance: () => {
      void advanceMission();
    },
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/missions/${encodeURIComponent(resolvedMissionId)}`, { signal: AbortSignal.timeout(8000) });
        const body = await res.json();
        if (!res.ok || !body?.data?.mission) throw new Error("Mission unavailable");
        if (cancelled) return;
        setMission(body.data.mission as Mission);
        const attemptRes = await fetch(`/api/missions/${encodeURIComponent(resolvedMissionId)}/attempt`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ learnerId, action: "start" }),
        });
        const attemptBody = await attemptRes.json();
        if (!attemptRes.ok || !attemptBody?.data?.attemptId) throw new Error("Mission attempt unavailable");
        if (!cancelled) setAttemptId(attemptBody.data.attemptId);
      } catch {
        if (!cancelled) setError("This mission could not load. Your other learning adventures are safe.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [learnerId, resolvedMissionId]);

  React.useEffect(() => {
    stepStartedAt.current = Date.now();
    setFeedback(null);
    setHintIndex(0);
  }, [index]);

  async function submit(response: MissionResponse, evidence?: Record<string, unknown>) {
    if (!mission || !current || !attemptId || flow.phase !== "idle") return;
    const responseTimeMs = Math.max(0, Date.now() - stepStartedAt.current);
     const strategyUsed = typeof evidence?.strategyUsed === "string" ? evidence.strategyUsed : undefined;
     const res = await fetch(`/api/missions/${encodeURIComponent(resolvedMissionId)}/steps/${encodeURIComponent(current.stepId)}/result`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ learnerId, attemptId, response, attempts: 1, responseTimeMs, hintsUsed, ...(strategyUsed ? { strategyUsed } : {}), interactionEvidence: evidence }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    const ok = Boolean(body?.data?.correct);
    if (!flow.submit(ok)) return;
    setFeedback(ok);
    if (ok) setCorrect((value) => value + 1);
    queueEvent({
       gameId: `mission:${mission.templateId}`, contentId: current.content.contentId,
      event: ok ? "answer_correct" : "answer_incorrect",
       metadata: { missionId: resolvedMissionId, stepId: current.stepId, skill: current.metadata.skill, difficulty: current.difficulty, responseTimeMs, hintsUsed, strategyUsed: evidence?.strategyUsed },
    });
    syncEvents().catch(() => {});
    if (ok && mission) {
      // A real reaction: wording, expression, and delivery rotate with every
      // success — never the same recording twice in a row.
      const reaction = praiseFor({ characterId: companion, moment: "round", count: correct, salt: mission.templateId });
      speakWithCharacter(reaction.line, { lang: "en-US", rate: reaction.rate, pitch: reaction.pitch, characterId: companion });
    }
  }

  async function advanceMission() {
    if (!mission || !attemptId || feedback === null) return;
    if (index + 1 < mission.steps.length) {
      setIndex((value) => value + 1);
      return;
    }
     const res = await fetch(`/api/missions/${encodeURIComponent(resolvedMissionId)}/attempt`, {
      method: "POST", headers: { "content-type": "application/json" },
       body: JSON.stringify({ learnerId, action: "complete", attemptId }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    if (typeof body?.data?.stars === "number") setEarnedStars(body.data.stars);
    if (res?.ok || learnerId === "guest") {
      setDone(true);
      // Authoritative sticker claim; the attempt id is the idempotency key so
      // a retried finish can never award twice.
      if (learnerId !== "guest" && mission) {
        fetch(`/api/learners/${encodeURIComponent(learnerId)}/rewards/claim`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ gameId: mission.gameType, accuracy: typeof body?.data?.accuracy === "number" ? body.data.accuracy : undefined, claimId: attemptId }),
        })
          .then((claimRes) => claimRes.json().catch(() => null))
          .then((claimBody) => {
            const sticker = claimBody?.data?.sticker;
            if (sticker) {
              adoptServerSticker(sticker, mission.gameType);
              setMissionSticker({ id: sticker.id, emoji: sticker.emoji, name: sticker.name });
            }
            if (claimBody?.data?.milestone) setMissionMilestone(claimBody.data.milestone);
          })
          .catch(() => {});
      }
    }
  }

  if (loading) return <GameShell title="Today's Adventure" stars={0}><div role="status" className="safe-panel mx-auto mt-8 max-w-game p-8 text-center">Preparing your mini mission… ✨</div></GameShell>;
  if (error || !mission || !current) return <GameShell title="Today's Adventure" stars={0}><div className="safe-panel mx-auto mt-8 max-w-game p-8 text-center"><p>{error ?? "Mission unavailable."}</p><Link href="/play" className="mt-4 inline-block underline">Back to adventures</Link></div></GameShell>;

  return (
    <GameShell title={mission.title} stars={done ? (earnedStars ?? correct) : correct} progress={{ current: index + 1, total: mission.steps.length }}>
      <div className="mx-auto flex w-full max-w-game flex-col gap-3 px-4 pb-24 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-black text-white">MINI MISSION</span>
          <span className="text-xs font-bold text-on-surface-variant">{index + 1} of {mission.steps.length} · {mission.estimatedMinutes} min</span>
        </div>
        <CharacterGuide character={companion} state={done ? "celebrating" : feedback === true ? "happy" : feedback === false ? "encouraging" : "thinking"} line={done ? "You finished today's adventure!" : current.prompt} />
        {done ? (
          missionSticker ? (
            <WorldReward
              sticker={{ id: missionSticker.id, emoji: missionSticker.emoji, name: missionSticker.name, gameId: mission.gameType, earnedAt: new Date().toISOString() }}
              character={companion as import("@/lib/characters").CharacterId}
              milestone={missionMilestone}
              variantSeed={missionSticker.id}
              onReplay={() => {
                // Replay handled by parent route; go home to pick next.
                window.location.assign("/play");
              }}
            />
          ) : (
            <div className="safe-panel relative overflow-hidden p-8 text-center">
              <BalloonBurst />
              <p aria-hidden className="text-5xl">🌟</p>
              <h2 className="mt-2 text-headline-lg">Great job!</h2>
              <p className="text-on-surface-variant">You practiced {mission.primarySkill} and finished {correct} of {mission.steps.length} steps.{earnedStars !== null ? ` You earned ${earnedStars} ${earnedStars === 1 ? "star" : "stars"}!` : ""}</p>
              {missionMilestone ? <p role="status" className="mt-2 rounded-full bg-secondary-fixed px-3 py-1 text-xs font-black uppercase tracking-wide">{missionMilestone.emoji} {missionMilestone.name}! {missionMilestone.message}</p> : null}
              <div className="mt-4 flex gap-2"><Link href="/play" className="tactile-button flex-1 bg-surface-high px-4 py-3 text-center">More adventures</Link><Link href="/" className="tactile-button flex-1 bg-primary px-4 py-3 text-center text-white">Home</Link></div>
            </div>
          )
        ) : (
          <div className="safe-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{mission.title} · {current.metadata.skill}</p>
            <h1 className="mt-1 text-headline-md">{current.prompt}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{current.expectedInteraction.replaceAll("-", " ")}</p>
            <ActivityRenderer step={current} disabled={feedback !== null} hintIndex={hintIndex} onSubmit={submit} />
            {feedback !== null && <RoundFeedback correct={feedback === true} title={feedback ? "✅ Nice thinking!" : "🌱 Not quite. You can learn from that try."} celebrate={feedback === true} />}
            <div className="mt-3 flex items-center gap-2">
              <button type="button" disabled={feedback !== null || hintIndex >= current.hints.length} onClick={() => { setHintIndex((value) => value + 1); setHintsUsed((value) => value + 1); }} className="tactile rounded-full bg-secondary-fixed px-4 py-2 text-sm font-bold disabled:opacity-50">💡 Hint{hintIndex ? ` (${hintIndex}/${current.hints.length})` : ""}</button>
              {feedback !== null && <button type="button" onClick={() => flow.advanceNow()} className="tactile-button ml-auto bg-primary px-6 py-2 text-white">{index + 1 === mission.steps.length ? "Finish" : "Next"} →</button>}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
