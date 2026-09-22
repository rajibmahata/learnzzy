import { CURRICULUM_FRAMEWORKS, CURRICULUM_OUTCOMES } from "./registry.ts";
import { LEARNING_ACTIVITY_REGISTRY } from "../learningActivities.ts";

// Simplified coverage: each outcome is covered if at least one active learning activity maps to it.
// In production this would read CurriculumMapping collection; here we use skill-based heuristic.

const OUTCOME_SKILL_MAP: Record<string, string[]> = {
  "cbse-math-count-10": ["counting"],
  "cbse-math-add-10": ["addition"],
  "cambridge-math-add-10": ["addition", "counting"],
  "cambridge-eng-phonics": ["phonics", "letter-recognition"],
  "cbse-math-multiplication": ["multiplication"],
  "cbse-math-geometry": ["geometry"],
  "cambridge-science-plants": ["plants"],
  "cambridge-computing-sequence": ["sequencing"],
  "ib-inquiry": ["discovery"],
  "cisce-evs-nature": ["discovery"],
};

export function calculateCoverage() {
  const activities = LEARNING_ACTIVITY_REGISTRY.filter((a) => a.status === "active");
  const skills = new Set(activities.map((a) => a.skill));
  const byOutcome = CURRICULUM_OUTCOMES.map((o) => {
    const needed = OUTCOME_SKILL_MAP[o.id] ?? [];
    const covered = needed.some((s) => skills.has(s));
    return { outcome: o, covered, neededSkills: needed, mappedActivities: activities.filter((a) => needed.includes(a.skill)).map((a) => a.id) };
  });
  const covered = byOutcome.filter((x) => x.covered).length;
  const total = byOutcome.length;
  return {
    frameworks: CURRICULUM_FRAMEWORKS.length,
    stages: 6,
    subjects: 6,
    outcomes: total,
    mapped: covered,
    coveragePct: total ? Math.round((covered / total) * 100) : 0,
    details: byOutcome,
  };
}

export function gapReport() {
  const cov = calculateCoverage();
  const missingOutcomes = cov.details.filter((d) => !d.covered).map((d) => d.outcome.id);
  const missingSkills = ["multiplication", "division", "geometry"].filter((s) => !LEARNING_ACTIVITY_REGISTRY.some((a) => a.skill === s));
  return {
    missingOutcomes,
    missingSkills,
    missingFrameworks: [] as string[],
    coveragePct: cov.coveragePct,
  };
}
