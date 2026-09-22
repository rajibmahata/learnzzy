"use client";

import * as React from "react";
import { ParentShell, ParentCard, MasteryBar } from "@/components/parent/ParentShell";
import { parentGet, childLabel, type ChildSummary } from "@/lib/parentApi";

interface SkillRow {
  gameId: string;
  name: string;
  level: number;
  masteryPct: number;
  recentAccuracyPct: number;
  trend: string;
  completions: number;
  hintsUsed: number;
  summary: string;
}

interface ProgressData {
  level: number;
  totalStars: number;
  stickerCount: number;
  perGame: { gameId: string; name: string; completions: number; bestAccuracyPct: number }[];
  concepts: { conceptId: string; name: string; masteryPct: number; attempts: number }[];
  skills: SkillRow[];
  lastResult: { gameId: string; accuracy: number; stars: number; level: number; hintsUsed: number; durationMs?: number; at: string } | null;
  strengths: string[];
  practiceOpportunities: string[];
  journey: { currentLevel: number; tracks: { id: string; title: string; levels: { level: number; status: string }[] }[] };
  academic?: {
    conceptsLearned: number;
    conceptsMastered: number;
    conceptsPracticing: number;
    streakDays: number;
    nextActivity: { game: string; concept: string; objective: string; reason: string } | null;
  };
  missions: { missionId: string; completedSteps: number; totalSteps: number; attempts: number; correctSteps: number; completedAt: string | null; updatedAt: string }[];
  missionSkills: { skill: string; attempts: number; completed: number; correct: number; accuracyPct: number; hintsUsed: number; averageResponseTimeMs: number; lastPracticedAt: string | null }[];
}

const TREND_LABEL: Record<string, string> = {
  strong: "Strong",
  improving: "Improving",
  steady: "Steady",
  needs_practice: "Needs practice",
};

export default function ParentProgressPage() {
  const [rows, setRows] = React.useState<{ child: ChildSummary; progress: ProgressData }[] | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const { children } = await parentGet<{ children: ChildSummary[] }>("/api/parent/children");
        const out = [];
        for (const child of children) {
          const progress = await parentGet<ProgressData>(`/api/parent/children/${child.learnerId}/progress`).catch(() => null);
          if (progress) out.push({ child, progress });
        }
        setRows(out);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <ParentShell title="Progress">
      {!rows ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <ParentCard title="No progress yet"><p className="text-sm text-on-surface-variant">Progress appears after your child completes games.</p></ParentCard>
      ) : (
        rows.map(({ child, progress }) => (
          <ParentCard key={child.learnerId} title={`${childLabel(child)} · Level ${progress.level}`}>
            {progress.lastResult && (
              <div className="mb-3 rounded-lg bg-primary-fixed p-3" aria-label="Latest result">
                <p className="text-xs font-black uppercase tracking-wide text-on-primary-fixed">Latest result · {new Date(progress.lastResult.at).toLocaleString()}</p>
                <p className="mt-1 text-sm font-black capitalize">
                  {progress.lastResult.gameId} · Level {progress.lastResult.level} · {Math.round(progress.lastResult.accuracy * 100)}% accuracy
                </p>
                <p className="text-xs text-on-surface-variant">⭐ {progress.lastResult.stars} · 💡 {progress.lastResult.hintsUsed} hints{typeof progress.lastResult.durationMs === "number" ? ` · ⏱ ${(progress.lastResult.durationMs / 1000).toFixed(1)}s` : ""} · Completed</p>
              </div>
            )}
            {progress.skills && progress.skills.length > 0 && (
              <div className="mb-3 rounded-lg bg-surface-low p-3" aria-label="Skill mastery">
                <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Skill mastery · Global Level {progress.level} · complexity personalized</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {progress.skills.map((s) => (
                    <li key={s.gameId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{s.name}</span>
                        <span className="text-xs font-black">{TREND_LABEL[s.trend] ?? s.trend} · {s.masteryPct}%</span>
                      </div>
                      <MasteryBar pct={s.masteryPct} />
                      <p className="mt-0.5 text-xs text-on-surface-variant">{s.completions} plays · {s.recentAccuracyPct}% recent · {s.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(progress.strengths?.length > 0 || progress.practiceOpportunities?.length > 0) && (
              <div className="mb-3 rounded-lg bg-surface-low p-3">
                {progress.strengths?.length > 0 && <p className="text-sm"><strong>Strengths:</strong> {progress.strengths.join(" · ")}</p>}
                {progress.practiceOpportunities?.length > 0 && <p className="mt-1 text-sm"><strong>Practice next:</strong> {progress.practiceOpportunities.join(" · ")}</p>}
              </div>
            )}
            {progress.academic && (
              <div className="mb-3 rounded-lg bg-surface-low p-3" aria-label="Learning progress">
                <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Learning · streak {progress.academic.streakDays} {progress.academic.streakDays === 1 ? "day" : "days"}</p>
                <p className="mt-1 text-sm">{progress.academic.conceptsLearned} learned · {progress.academic.conceptsMastered} mastered · {progress.academic.conceptsPracticing} practicing</p>
                {progress.academic.nextActivity && (
                  <p className="mt-1 text-sm"><strong>Next:</strong> {progress.academic.nextActivity.reason}</p>
                )}
              </div>
            )}
            {progress.missions?.length > 0 && (
              <div className="mb-3 rounded-lg bg-secondary-fixed/40 p-3" aria-label="Mini mission progress">
                <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Recent mini missions</p>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {progress.missions.slice(0, 4).map((mission) => (
                    <li key={mission.missionId} className="flex items-center justify-between gap-2"><span className="truncate font-bold">{mission.missionId.split(":")[1]?.replaceAll("-", " ") ?? "Mini mission"}</span><span className="text-xs">{mission.completedAt ? "Completed" : `${mission.completedSteps}/${mission.totalSteps} steps`}</span></li>
                  ))}
                </ul>
                {progress.missionSkills?.length > 0 && <p className="mt-2 text-xs text-on-surface-variant">Skills practiced: {progress.missionSkills.map((skill) => `${skill.skill} (${skill.accuracyPct}%)`).join(" · ")}</p>}
              </div>
            )}
            <div className="mb-3 rounded-lg bg-surface-low p-3">
              <p className="text-xs font-black uppercase tracking-wide text-on-surface-variant">Learning journey · Current level {progress.journey.currentLevel}</p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                {progress.journey.tracks.map((track) => (
                  <div key={track.id} className="flex items-center justify-between gap-2">
                    <span className="font-bold">{track.title}</span>
                    <span className="text-xs text-on-surface-variant">
                      {track.levels.map((level) => level.status === "completed" ? "✓" : level.status === "current" ? "★" : "·").join(" ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {progress.perGame.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No completed games yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {progress.perGame.map((g) => (
                  <li key={g.gameId}>
                    <div className="flex items-center justify-between text-sm"><span className="font-bold">{g.name}</span><span>{g.completions} plays · {g.bestAccuracyPct}% best</span></div>
                    <MasteryBar pct={g.bestAccuracyPct} />
                  </li>
                ))}
              </ul>
            )}
          </ParentCard>
        ))
      )}
    </ParentShell>
  );
}
