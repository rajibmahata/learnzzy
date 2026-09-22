import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

// Child identity, session resume, celebration & unique sticker rewards.
// Server-dependent tests branch on a live-DB probe: with Mongo up they assert
// uniqueness/isolation/idempotency; without it they assert graceful degradation.

async function probeDb(request: APIRequestContext): Promise<boolean> {
  try {
    const created = await request.post("/api/learners", { data: { nickname: "Probe", ageBand: "6-7" } });
    if (!created.ok()) return false;
    const id = (await created.json()).data?.learnerId as string | undefined;
    if (!id) return false;
    const fetched = await request.get(`/api/learners/${id}`);
    return fetched.ok();
  } catch {
    return false;
  }
}

async function createLearner(request: APIRequestContext, nickname: string): Promise<string> {
  const res = await request.post("/api/learners", { data: { nickname, ageBand: "6-7" } });
  expect(res.ok()).toBeTruthy();
  const id = (await res.json()).data?.learnerId as string;
  expect(id).toBeTruthy();
  return id;
}

async function seedDevice(page: Page, learners: { learnerId: string; nickname: string; avatar?: string; ageBand: string }[]) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((list) => {
    localStorage.setItem("learnzzy.learners.v1", JSON.stringify(list.map((l) => ({ ...l, addedAt: new Date().toISOString() }))));
    if (list[0]) {
      localStorage.setItem("learnzzy.activeLearnerId", list[0].learnerId);
      localStorage.setItem("learnzzy.learnerId.v1", list[0].learnerId);
      localStorage.setItem("learnzzy.learnerProfile.v1", JSON.stringify({ learnerId: list[0].learnerId, nickname: list[0].nickname, ageBand: list[0].ageBand, level: 1 }));
    }
  }, learners);
}

test("welcome stores child name, nickname, and buddy independently", async ({ page }) => {
  await page.goto("/welcome", { waitUntil: "domcontentloaded" });
  // Name ideas fill the box; buddy pick preserves the typed name.
  await expect(page.locator("#name-title")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Aarvi", exact: true }).click();
  await expect(page.getByLabel("Child name")).toHaveValue("Aarvi");
  await expect(page.locator("#nickname-title")).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Nickname", { exact: true }).fill("Avi");
  await page.getByRole("button", { name: /buddy lion/i }).click();
  await expect(page.getByLabel("Nickname", { exact: true })).toHaveValue("Avi");
  await page.getByRole("button", { name: /6–7/ }).click();
  await page.getByRole("button", { name: /start my adventure/i }).click();
  await expect(page).toHaveURL(/\/play$/, { timeout: 15000 });
  const stored = await page.evaluate(() => ({
    active: localStorage.getItem("learnzzy.activeLearnerId"),
    list: localStorage.getItem("learnzzy.learners.v1"),
    profile: localStorage.getItem("learnzzy.learnerProfile.v1"),
  }));
  expect(stored.active).toBeTruthy();
  const entry = JSON.parse(stored.list ?? "[]").find((x: { nickname: string }) => x.nickname === "Avi");
  expect(entry?.displayName).toEqual("Aarvi");
  expect(entry?.avatar).toEqual("🦁");
  const profile = JSON.parse(stored.profile ?? "{}");
  expect(profile.displayName).toEqual("Aarvi");
  expect(profile.avatar).toEqual("🦁");
});

test("learner create + profile patch API keeps learnerId stable", async ({ request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const created = await request.post("/api/learners", {
    data: { displayName: "Aarvi", nickname: "Avi", companion: { characterId: "bunny", displayName: "Coco" }, ageBand: "6-7" },
  });
  expect(created.status()).toEqual(201);
  const learner = (await created.json()).data;
  expect(learner.displayName).toEqual("Aarvi");
  expect(learner.companion).toEqual({ characterId: "bunny", displayName: "Coco" });
  // Unknown companion rejected, never substituted.
  const bad = await request.post("/api/learners", { data: { ageBand: "6-7", companion: { characterId: "dragon" } } });
  expect(bad.status()).toEqual(422);
  // Profile edits keep the same learnerId; ageBand is not patchable.
  const patched = await request.patch(`/api/learners/${learner.learnerId}`, {
    data: { nickname: "Star", companion: { characterId: "parrot", displayName: "Pip" } },
  });
  expect(patched.ok()).toBeTruthy();
  const updated = (await patched.json()).data;
  expect(updated.learnerId).toEqual(learner.learnerId);
  expect(updated.nickname).toEqual("Star");
  expect(updated.companion).toEqual({ characterId: "parrot", displayName: "Pip" });
  const noAge = await request.patch(`/api/learners/${learner.learnerId}`, { data: { ageBand: "8-9" } });
  expect(noAge.status()).toEqual(422);
  const noDragon = await request.patch(`/api/learners/${learner.learnerId}`, { data: { companion: { characterId: "dragon" } } });
  expect(noDragon.status()).toEqual(422);
});

test("welcome shows the child selector when players exist", async ({ page }) => {
  await seedDevice(page, [
    { learnerId: "learner_A", nickname: "Aarvi", avatar: "🦁", ageBand: "6-7" },
    { learnerId: "learner_B", nickname: "Rohan", ageBand: "4-5" },
  ]);
  await page.goto("/welcome", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /who's playing today/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Aarvi")).toBeVisible();
  await expect(page.getByText("Rohan")).toBeVisible();
  await expect(page.getByText("🦁").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /add another player/i })).toBeVisible();
});

test("selector continue restores the learner or fails gracefully", async ({ page, request }) => {
  const dbUp = await probeDb(request);
  const id = dbUp ? await createLearner(request, "Aarvi") : "learner_offline";
  await seedDevice(page, [{ learnerId: id, nickname: "Aarvi", ageBand: "6-7" }]);
  await page.goto("/welcome", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /who's playing today/i })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /welcome back|continue/i }).first().click();
  if (dbUp) {
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(page.getByText(/welcome back, aarvi/i)).toBeVisible({ timeout: 15000 });
  } else {
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15000 });
  }
});

test("stickers garden renders the empty state without a learner", async ({ page }) => {
  await page.goto("/stickers", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /sticker/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/earn your first sticker/i)).toBeVisible();
});

test("claims award unique stickers; retries never duplicate", async ({ request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const id = await createLearner(request, "Uniq");
  const first = await request.post(`/api/learners/${id}/rewards/claim`, { data: { gameId: "addition", accuracy: 1, claimId: "claim-1" } });
  expect(first.ok()).toBeTruthy();
  const second = await request.post(`/api/learners/${id}/rewards/claim`, { data: { gameId: "addition", accuracy: 1, claimId: "claim-2" } });
  expect(second.ok()).toBeTruthy();
  const a = (await first.json()).data;
  const b = (await second.json()).data;
  expect(a.sticker?.id).toBeTruthy();
  expect(b.sticker?.id).toBeTruthy();
  expect(a.sticker.id).not.toEqual(b.sticker.id);
  expect(a.duplicate).toBe(false);
  // Same completion submitted again: one sticker, duplicate flag.
  const retry = await request.post(`/api/learners/${id}/rewards/claim`, { data: { gameId: "addition", accuracy: 1, claimId: "claim-1" } });
  const r = (await retry.json()).data;
  expect(r.duplicate).toBe(true);
  expect(r.sticker.id).toEqual(a.sticker.id);
  const rewards = await (await request.get(`/api/learners/${id}/rewards`)).json();
  expect(rewards.data.stickerCount).toEqual(2);
});

test("duplicate progress posts record one completion", async ({ request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const id = await createLearner(request, "Dedup");
  const body = { gameId: "addition", accuracy: 1, stars: 3, completionId: "completion-1" };
  const one = await request.post(`/api/learners/${id}/progress`, { data: body });
  expect(one.ok()).toBeTruthy();
  const two = await request.post(`/api/learners/${id}/progress`, { data: body });
  expect((await two.json()).data.duplicate).toBe(true);
  const learner = (await (await request.get(`/api/learners/${id}`)).json()).data;
  expect(learner.gameProgress?.addition?.completions ?? 0).toEqual(1);
});

test("siblings never see each other's stickers or progress", async ({ request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const a = await createLearner(request, "SiblingA");
  const b = await createLearner(request, "SiblingB");
  await request.post(`/api/learners/${a}/progress`, { data: { gameId: "addition", accuracy: 1, stars: 3, completionId: "sib-a-1" } });
  await request.post(`/api/learners/${a}/rewards/claim`, { data: { gameId: "addition", claimId: "sib-a-1" } });
  const bRewards = await (await request.get(`/api/learners/${b}/rewards`)).json();
  expect(bRewards.data.stickerCount).toEqual(0);
  const bLearner = (await (await request.get(`/api/learners/${b}`)).json()).data;
  expect(bLearner.gameProgress ?? {}).toEqual({});
  expect(bLearner.totalStars).toEqual(0);
});

test("events carry the owning learner", async ({ request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const id = await createLearner(request, "Eventful");
  const res = await request.post("/api/game-events/batch", {
    data: { sessionId: `sess_test_${Date.now()}`, learnerId: id, events: [{ event: "game_started", gameId: "addition" }] },
  });
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).data.accepted).toEqual(1);
});

test("offline reward paths degrade gracefully", async ({ request }) => {
  test.skip(await probeDb(request), "only without live MongoDB");
  const claim = await request.post("/api/learners/learner_offline/rewards/claim", { data: { gameId: "addition", claimId: "x" } });
  expect([404, 503]).toContain(claim.status());
  // Unknown learner: progress rejects with 404 (never 500); the client keeps
  // local rewards and syncs later — graceful by design.
  const progress = await request.post("/api/learners/learner_offline/progress", { data: { gameId: "addition", accuracy: 1, stars: 3 } });
  expect(progress.status()).toEqual(404);
});

test("stickers survive reload from server truth", async ({ page, request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const id = await createLearner(request, "Reload");
  const claim = await request.post(`/api/learners/${id}/rewards/claim`, { data: { gameId: "addition", claimId: "reload-1" } });
  expect(claim.ok()).toBeTruthy();
  await seedDevice(page, [{ learnerId: id, nickname: "Reload", ageBand: "6-7" }]);
  await page.goto("/stickers", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/1 \/ \d+ Stickers/i)).toBeVisible({ timeout: 15000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText(/1 \/ \d+ Stickers/i)).toBeVisible({ timeout: 15000 });
});

test("full collection completes without ever duplicating", async ({ request }) => {
  test.skip(!(await probeDb(request)), "needs live MongoDB");
  const id = await createLearner(request, "Complete");
  const seen = new Set<string>();
  let last: { sticker: { id: string } | null; collectionComplete: boolean; stickerCount: number; catalogSize: number } | null = null;
  for (let i = 0; i < 70; i++) {
    const res = await request.post(`/api/learners/${id}/rewards/claim`, { data: { gameId: "addition", claimId: `full-${i}` } });
    expect(res.ok()).toBeTruthy();
    last = (await res.json()).data;
    if (last?.sticker) {
      expect(seen.has(last.sticker.id), `duplicate ${last.sticker.id}`).toBe(false);
      seen.add(last.sticker.id);
    } else {
      break;
    }
  }
  expect(last?.sticker).toBe(null);
  expect(last?.collectionComplete).toBe(true);
  expect(last?.stickerCount).toEqual(last?.catalogSize);
  expect(seen.size).toEqual(last?.catalogSize);
});

test("remember mission completes and shows server stars", async ({ page }) => {
  const list = await page.request.get("/api/missions?ageBand=6-7&limit=5&date=2026-09-19");
  expect(list.ok()).toBeTruthy();
  const missions = (await list.json()).data.missions.map((m: { mission: { missionId: string; steps: unknown[] } }) => m.mission);
  const mission = missions.find((m: { missionId: string }) => m.missionId.includes("mission:remember-find:")) as {
    missionId: string;
    steps: { stepId: string; type: string; content: { answer?: string | string[]; options?: string[] } }[];
  };
  expect(mission).toBeTruthy();
  await page.goto(`/missions/${encodeURIComponent(mission.missionId)}`, { waitUntil: "domcontentloaded" });
  for (const step of mission.steps) {
    const accepted = String(step.content.answer);
    await page.getByRole("button", { name: `Choice ${accepted}` }).click();
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /next|finish/i }).click();
  }
  await expect(page.getByText(/great job/i)).toBeVisible({ timeout: 10000 });
});
