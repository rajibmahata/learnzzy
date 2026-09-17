import { test, expect } from "@playwright/test";

// Adaptive engine end-to-end (API + parent dashboard):
// strong addition results promote ONLY addition; weak subtraction stays;
// parent sees per-skill levels plus the latest result.
test("per-skill adaptive levels evolve independently", async ({ page }) => {
  const api = page.request;

  // 1. Learner joins (no account wall for play; server owns progression).
  const mk = await api.post("/api/learners", { data: { ageBand: "6-7" } });
  expect(mk.ok()).toBeTruthy();
  const learnerId = (await mk.json()).data.learnerId as string;

  async function report(gameId: string, accuracy: number) {
    const r = await api.post(`/api/learners/${learnerId}/progress`, {
      data: { gameId, accuracy, stars: 3 },
    });
    expect(r.ok()).toBeTruthy();
    return (await r.json()).data as {
      skill: { gameId: string; action: string; level: number };
    };
  }

  // 2-3. Three strong addition activities → addition promotes exactly +1.
  await report("addition", 0.9);
  await report("addition", 0.88);
  const third = await report("addition", 0.92);
  expect(third.skill.action).toBe("promote");
  expect(third.skill.level).toBe(2);

  // 4. Skills endpoint: addition L2, subtraction untouched at L1.
  const skillsRes = await api.get(`/api/learners/${learnerId}/skills`);
  expect(skillsRes.ok()).toBeTruthy();
  const skills = (await skillsRes.json()).data.skills as { gameId: string; level: number }[];
  expect(skills.find((s) => s.gameId === "addition")?.level).toBe(2);
  expect(skills.find((s) => s.gameId === "subtraction")?.level).toBe(1);

  // 5-6. Content API serves the skill's complexity, not the global level.
  const content = await api.get(`/api/games/addition/content?difficulty=1&limit=3&learnerId=${learnerId}`);
  expect(content.ok()).toBeTruthy();
  expect((await content.json()).data.skillLevel).toBe(2);

  // 7-8. Repeated weak subtraction: stabilizes, never punishes below floor.
  for (const a of [0.4, 0.42, 0.38, 0.45, 0.41]) await report("subtraction", a);
  const after = (await (await api.get(`/api/learners/${learnerId}/skills`)).json()).data.skills as {
    gameId: string;
    level: number;
  }[];
  expect(after.find((s) => s.gameId === "subtraction")?.level).toBe(1);
  // 9. Addition independence: still L2 after subtraction struggles.
  expect(after.find((s) => s.gameId === "addition")?.level).toBe(2);

  // 10-12. Parent links the device, approves, and sees skill levels + latest result.
  const email = `adaptive${Date.now()}@example.com`;
  const reg = await api.post("/api/parent/auth/register", {
    data: { email, password: "adaptive-parent-1" },
  });
  expect(reg.ok()).toBeTruthy();
  const codeRes = await api.post("/api/parent/pairing", { data: {} });
  expect(codeRes.ok()).toBeTruthy();
  const code = (await codeRes.json()).data.code as string;
  const confirm = await api.post("/api/pairing/confirm", { data: { code, learnerId } });
  expect(confirm.ok()).toBeTruthy();
  const approve = await api.post("/api/parent/pairing", { data: { action: "approve", learnerId } });
  expect(approve.ok()).toBeTruthy();

  const prog = await api.get(`/api/parent/children/${learnerId}/progress`);
  expect(prog.ok()).toBeTruthy();
  const data = (await prog.json()).data as {
    skills: { gameId: string; level: number; trend: string }[];
    lastResult: { gameId: string; accuracy: number } | null;
  };
  expect(data.skills.find((s) => s.gameId === "addition")?.level).toBe(2);
  expect(data.lastResult).not.toBeNull();

  // 13-15. Dashboard renders per-skill levels and the latest result card.
  await page.goto("/parent/progress");
  await expect(page.getByText(/skill levels/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/latest result/i).first()).toBeVisible();
  await expect(page.getByText(/level 2/i).first()).toBeVisible();
});
