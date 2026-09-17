import { test, expect } from "@playwright/test";

// Discovery World journey: learn cards → recognize → find → complete →
// concept mastery recorded → parent sees discovery progress.
test("discover journey: learn, recognize, find, complete", async ({ page }) => {
  await page.goto("/welcome");
  await page.getByLabel("Nickname").fill("Discovery Kid");
  await page.getByRole("button", { name: /6–7/ }).click();
  await page.getByRole("button", { name: /let's play/i }).click();
  await expect(page).toHaveURL(/\/play$/, { timeout: 15000 });

  await page.goto("/play/discover");
  // LEARN: three concept cards with hear + fact + next.
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole("button", { name: /hear about/i }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: /^next/i }).click();
  }
  // RECOGNIZE: click the deterministic correct option directly.
  for (let i = 0; i < 3; i++) {
    const group = page.getByRole("group", { name: /answer choices/i });
    await expect(group.getByRole("button").first()).toBeVisible({ timeout: 15000 });
    await group.locator('[data-correct="true"]').click();
    await expect(page.getByText(/great job/i).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1100);
  }
  // FIND: parse "Find N Names!" then tap matching buttons.
  for (let i = 0; i < 3; i++) {
    const heading = page.getByRole("heading", { name: /^find \d+/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    const text = (await heading.textContent()) ?? "";
    const m = text.match(/find (\d+) (.+)!/i);
    const need = Number(m?.[1] ?? 2);
    const name = (m?.[2] ?? "").replace(/s$/, "");
    const group = page.getByRole("group", { name: /find the/i });
    for (let t = 0; t < need; t++) {
      await group.getByRole("button", { name: new RegExp(`^${name}$`, "i") }).nth(t).click();
    }
    const foundAll = page.getByText(/found them all/i);
    await expect(foundAll).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1100);
  }
  // Completion celebrates and rewards.
  await expect(page.getByRole("heading", { name: /amazing/i })).toBeVisible({ timeout: 15000 });
});

test("parent sees discovery progress after linking", async ({ page }) => {
  const api = page.request;
  const mk = await api.post("/api/learners", { data: { ageBand: "6-7" } });
  const learnerId = (await mk.json()).data.learnerId as string;
  for (const [signal, correct] of [["exposed", true], ["recognized", true], ["recognized", true], ["recognized", true]] as const) {
    await api.post(`/api/learners/${learnerId}/concepts`, {
      data: { conceptId: "birds.parrot", signal, correct },
    });
  }
  const email = `discover${Date.now()}@example.com`;
  await api.post("/api/parent/auth/register", { data: { email, password: "discovery-parent-1" } });
  const code = (await (await api.post("/api/parent/pairing", { data: {} })).json()).data.code as string;
  await api.post("/api/pairing/confirm", { data: { code, learnerId } });
  await api.post("/api/parent/pairing", { data: { action: "approve", learnerId } });

  await page.goto("/parent/learning");
  await expect(page.getByText(/discovery world/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/1 learned/i).first()).toBeVisible();
});
