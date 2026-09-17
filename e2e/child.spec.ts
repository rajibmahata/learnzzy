import { test, expect } from "@playwright/test";

// Child surfaces: landing, learner setup, play home, one game, stickers.
test("landing renders hero + play CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /tiny games/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start playing/i })).toBeVisible();
  await expect(page.locator("footer").getByRole("link", { name: /for parents/i })).toBeVisible();
});

test("welcome collects nickname + age band", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: /what should we call you/i })).toBeVisible();
  await page.getByLabel("Nickname").fill("Playwright Kid");
  await page.getByRole("button", { name: /6–7/ }).click();
  await page.getByRole("button", { name: /let's play/i }).click();
  await expect(page).toHaveURL(/\/play$/, { timeout: 15000 });
});

test("play home lists five games", async ({ page }) => {
  await page.goto("/play");
  for (const name of ["Number Adventure", "Fly Away", "Clean Up", "Picture Puzzle", "Shadow Sketch"]) {
    await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
  }
});

test("addition game loads and answers", async ({ page }) => {
  await page.goto("/play/addition");
  // Answer buttons appear once content loads (pool or deterministic fallback).
  const answers = page.getByRole("group", { name: /answer choices/i }).getByRole("button");
  await expect(answers.first()).toBeVisible({ timeout: 15000 });
  const box = await answers.first().boundingBox();
  // Touch targets: at least 40px in both dimensions.
  expect(box && box.width >= 40 && box.height >= 40).toBeTruthy();
  await answers.first().click();
  await expect(page.getByText(/great job|try again/i).first()).toBeVisible({ timeout: 15000 });
});

test("addition hint opens with a counting nudge", async ({ page }) => {
  await page.goto("/play/addition");
  const answers = page.getByRole("group", { name: /answer choices/i }).getByRole("button");
  await expect(answers.first()).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /show a hint/i }).click();
  await expect(page.getByRole("dialog", { name: /hint/i })).toBeVisible();
  await expect(page.getByText(/start at|count|just count/i).first()).toBeVisible();
});

test("subtraction hint opens with a take-away nudge", async ({ page }) => {
  await page.goto("/play/subtraction");
  const answers = page.getByRole("group", { name: /answer choices/i }).getByRole("button");
  await expect(answers.first()).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /show a hint/i }).click();
  await expect(page.getByRole("dialog", { name: /hint/i })).toBeVisible();
  await expect(page.getByText(/take away|nothing flew/i).first()).toBeVisible();
});

test("stickers page renders empty state", async ({ page }) => {
  await page.goto("/stickers");
  await expect(page.getByRole("heading", { name: /stickers/i })).toBeVisible();
});

test("link page accepts code input", async ({ page }) => {
  await page.goto("/link");
  await expect(page.getByLabel("Pairing code")).toBeVisible();
  await page.getByLabel("Pairing code").fill("ABC234");
});
