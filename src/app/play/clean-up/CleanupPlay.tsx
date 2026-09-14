"use client";

import * as React from "react";
import { GameShell } from "@/components/child/GameShell";
import { CleanupStage } from "@/components/child/CleanupStage";
import { Celebration } from "@/components/child/Celebration";
import { GAME_ROUNDS } from "@/games/framework";
import { createCleanupScene, isSceneComplete, type CleanupSceneDef } from "@/games/cleanup";
import { toCleanupContent } from "@/lib/pool-client";
import { useGameRounds } from "@/lib/useGameRounds";
import { getSessionId, queueEvent } from "@/lib/events";
import { useRewards, type Sticker } from "@/lib/rewards";
import { reportGameCompletion } from "@/lib/learnerSync";

export default function CleanupPlay() {
  const [round, setRound] = React.useState(0);
  const { totalStars, award } = useRewards();
  const [reward, setReward] = React.useState<{ stars: number; sticker: Sticker } | null>(null);
  const [collected, setCollected] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);

  const { rounds, reload } = useGameRounds<CleanupSceneDef>({
    gameId: "clean-up",
    difficulty: 1,
    total: GAME_ROUNDS,
    mapItem: toCleanupContent,
    makeLocal: (r) => createCleanupScene(`local-clean-${Date.now() % 2147483647}-${r}`, ["bedroom", "garden", "park"][r % 3], 3),
  });
  const scene = rounds?.[round]?.content;
  const contentId = rounds?.[round]?.contentId;
  const left = scene ? scene.targets.length - collected.length : 0;

  React.useEffect(() => {
    queueEvent({ event: "game_started", gameId: "clean-up", metadata: { sessionId: getSessionId() } });
  }, []);

  function collect(id: string) {
    if (!scene || done) return;
    if (collected.includes(id)) return;
    const next = [...collected, id];
    setCollected(next);
    queueEvent({ event: "answer_submitted", gameId: "clean-up", contentId, metadata: { targetId: id } });
    if (isSceneComplete(scene.targets.length, next)) {
      queueEvent({ event: "answer_correct", gameId: "clean-up", contentId });
      setTimeout(() => {
        if (round + 1 >= GAME_ROUNDS) {
          const r = award("clean-up", 5);
          setReward(r);
          setDone(true);
          queueEvent({ event: "game_completed", gameId: "clean-up", metadata: { stars: r.stars, sticker: r.sticker.emoji } });
          // Tap-to-clean has no wrong answers (decorations inert) — completion is the signal.
          reportGameCompletion({ gameId: "clean-up", accuracy: 1, stars: r.stars, stickerId: r.sticker.id, stickerEmoji: r.sticker.emoji });
        } else {
          setRound(round + 1);
          setCollected([]);
        }
      }, 800);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-game items-center justify-center px-4">
        <Celebration title="ALL CLEAN!" stars={reward?.stars ?? 5} sticker={reward?.sticker ?? null} onReplay={() => { setRound(0); setCollected([]); setDone(false); setReward(null); reload(); }} />
      </div>
    );
  }

  if (!scene) {
    return (
      <GameShell title="Clean Up" stars={totalStars}>
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center" role="status">
          <p aria-hidden className="text-5xl">🌈</p>
          <p className="mt-3 text-instruction">Getting your adventure ready...</p>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Clean Up" stars={totalStars}>
      <h2 className="mt-2 text-center text-instruction uppercase">CLEAN IT UP! 🧹</h2>
      <div aria-label={`${left} things left to clean`}>
        <CleanupStage scene={scene} onCollect={collect} />
      </div>
      <p aria-live="polite" className="mt-3 text-center text-lg font-bold">
        🧺 {left} thing{left === 1 ? "" : "s"} left
      </p>
    </GameShell>
  );
}
