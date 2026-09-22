import { test, expect } from "@playwright/test";

test("learner sees current, completed, and locked journey levels", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.locator("#name-title")).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Child name").fill("Journey Kid");
  await page.getByRole("button", { name: /6–7/ }).click();
  await page.getByRole("button", { name: /start my adventure/i }).click();
  await expect(page).toHaveURL(/\/play$/, { timeout: 15000 });

  await expect(page.getByRole("heading", { name: /level 1 is your next adventure/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /numbers adventure/i })).toBeVisible();
  await expect(page.getByLabel(/Numbers Adventure Level 1 Play now/i)).toBeVisible();
  await expect(page.getByLabel(/Numbers Adventure Level 2 locked/i)).toBeVisible();
  await expect(page.getByText("Creative Explorer")).toBeVisible();
  await expect(page.getByText("Visual Discoverer")).toBeVisible();
});

test("journey stays usable on a narrow phone", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: /what shall we play/i })).toBeVisible();
  const bodyWidth = await page.locator("body").evaluate((element) => element.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
});
