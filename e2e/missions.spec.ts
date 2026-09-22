import { test, expect, type Page } from "@playwright/test";

type Mission = {
  missionId: string;
  title: string;
  steps: Array<{
    stepId: string;
    type: string;
    content: { answer?: string | string[]; acceptedAnswers?: string[]; options?: string[]; letters?: string[]; visual?: string[]; groupItems?: Record<string, string> };
  }>;
};

async function missionFor(page: Page, templateId: string): Promise<Mission> {
  const response = await page.request.get("/api/missions?ageBand=6-7&limit=5&date=2026-09-19");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const result = body.data.missions.map((item: { mission: Mission }) => item.mission).find((mission: Mission) => mission.missionId.includes(`mission:${templateId}:`));
  expect(result).toBeTruthy();
  return result as Mission;
}

async function completeMission(page: Page, mission: Mission) {
  await page.goto(`/missions/${encodeURIComponent(mission.missionId)}`, { waitUntil: "domcontentloaded" });
  for (const step of mission.steps) {
    if (step.type === "sort") {
      for (const item of step.content.visual ?? []) {
        const group = step.content.groupItems?.[item];
        await page.getByRole("button", { name: `${item} in ${group}` }).click();
      }
      await page.getByRole("button", { name: /check groups/i }).click();
    } else if (step.type === "build_word") {
      const answer = String(step.content.answer);
      const used: Record<string, number> = {};
      for (const letter of answer.split("")) {
        const nth = used[letter] ?? 0;
        await page.getByRole("button", { name: `Letter ${letter}` }).nth(nth).click();
        used[letter] = nth + 1;
      }
      await page.getByRole("button", { name: /check word/i }).click();
    } else {
      const accepted = step.content.acceptedAnswers?.find((answer) => step.content.options?.includes(answer)) ?? String(step.content.answer);
      await page.getByRole("button", { name: `Choice ${accepted}` }).click();
    }
    await expect(page.getByRole("status")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /next|finish/i }).click();
  }
  await expect(page.getByText(/great job/i)).toBeVisible({ timeout: 10000 });
}

test("home exposes Today's Adventure without removing existing play", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /today's adventure/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("LEARNZZY LEARNING ADVENTURE")).toBeVisible();
  await expect(page.getByRole("link", { name: /start playing now/i })).toBeVisible();
});

test("Remember & Find mission completes on mobile", async ({ page }) => {
  await completeMission(page, await missionFor(page, "remember-find"));
});

test("Sort & Group mission completes", async ({ page }) => {
  await completeMission(page, await missionFor(page, "sort-group"));
});

test("Build the Word mission exposes letter tiles", async ({ page }) => {
  const mission = await missionFor(page, "build-word");
  await page.goto(`/missions/${encodeURIComponent(mission.missionId)}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("group", { name: /letter choices/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /check word/i })).toBeVisible();
});

test("Change One Thing and Find the Difference missions load", async ({ page }) => {
  for (const template of ["change-one-thing", "find-difference"]) {
    const mission = await missionFor(page, template);
    await page.goto(`/missions/${encodeURIComponent(mission.missionId)}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: new RegExp(mission.title, "i") })).toBeVisible({ timeout: 15000 });
  }
});
