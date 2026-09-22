import { test, expect } from "@playwright/test";

// Picture Puzzle guidance: level badge, what/where/how coach strip, zone
// captions, and live progress.
test("puzzle shows level, steps, and piece progress", async ({ page }) => {
  await page.goto("/play/puzzle", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/LEVEL \d/, { exact: false })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("list", { name: /how to play/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/find the piece that finishes the picture/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/loose pieces wait in the tray/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/tap its glowing home/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/picture homes/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("status")).toBeVisible({ timeout: 20000 });
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30000 });
});
