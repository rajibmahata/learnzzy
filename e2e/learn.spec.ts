import { test, expect } from "@playwright/test";

// Learning Playground: Home → Category → Activity → Answer → Next → Done.
// Uses the deterministic activities API (no Mongo needed); specs assert
// structure, labels, and touch targets — never content correctness.
test("play home shows learning world categories", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: /learning world/i })).toBeVisible();
  for (const name of ["Numbers & Math", "Words & Phonics", "Write & Create", "Think & Solve", "Shapes & Visual", "Discover", "Puzzles"]) {
    await expect(page.getByRole("link", { name: new RegExp(name.replace(/[&]/g, "."), "i") }).first()).toBeVisible();
  }
});

test("play home shows daily curiosity and learner tab", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("link", { name: /meet ellie in discovery world/i })).toBeVisible();
  await page.getByRole("link", { name: /change learner/i }).click();
  await expect(page).toHaveURL(/\/welcome$/, { timeout: 15000 });
});

test("numbers category lists its activities", async ({ page }) => {
  await page.goto("/learn/numbers");
  await expect(page.getByRole("heading", { name: /numbers & math/i }).last()).toBeVisible();
  for (const name of ["Count Together", "Big to Small", "Before & After", "More or Less", "Number Names", "Count by Tens"]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
});

test("count activity loads, answers, and advances", async ({ page }) => {
  await page.goto("/learn/numbers/number-count");
  const options = page.getByRole("button", { name: /^answer /i });
  await expect(options.first()).toBeVisible({ timeout: 15000 });
  const box = await options.first().boundingBox();
  expect(box && box.width >= 40 && box.height >= 40).toBeTruthy();
  await options.first().click();
  // Correct answers restate the fact ("Yes! …"), misses invite retry.
  await expect(page.getByText(/yes!|not quite/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /hint/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /next|finish/i }).click();
});

test("word family activity loads with picture + choices", async ({ page }) => {
  await page.goto("/learn/words/word-family");
  const options = page.getByRole("button", { name: /^answer /i });
  await expect(options.first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /read aloud/i })).toBeVisible();
});

test("words category exposes the full phonics activity set", async ({ page }) => {
  await page.goto("/learn/words");
  await expect(page.getByRole("heading", { name: /words & phonics/i }).last()).toBeVisible();
  for (const name of ["Word Families", "Read & Match", "Jumble Time", "Build the Word", "Family Baskets", "Listen & Choose", "Rhyme Detectives"]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

test("word builder renders letter tiles and clear control", async ({ page }) => {
  await page.goto("/learn/words/word-builder");
  await expect(page.getByRole("group", { name: /letter choices/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /clear/i })).toBeVisible();
  const tile = page.getByRole("group", { name: /letter choices/i }).getByRole("button").first();
  const box = await tile.boundingBox();
  expect(box && box.width >= 40 && box.height >= 40).toBeTruthy();
});

test("word sorting and listening use their dedicated controls", async ({ page }) => {
  await page.goto("/learn/words/word-sort");
  await expect(page.getByRole("group", { name: /word family baskets/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: /basket -/i }).first()).toBeVisible();

  await page.goto("/learn/words/word-listen");
  await expect(page.getByRole("button", { name: /play the word aloud/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("group", { name: /word choices/i })).toBeVisible();
});

test("memory activity completes a full round", async ({ page }) => {
  await page.goto("/learn/think/memory");
  const options = page.getByRole("button", { name: /^answer /i });
  await expect(options.first()).toBeVisible({ timeout: 15000 });
  await options.first().click();
  const next = page.getByRole("button", { name: /next|finish/i });
  await expect(next).toBeVisible({ timeout: 15000 });
});
