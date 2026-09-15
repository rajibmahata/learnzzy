import { test, expect } from "@playwright/test";

// Sketch/Edison flow: diagram visible → pick color → draw → complete.
// Covers mouse input; touch is exercised by the mobile/tablet projects
// (same pointer pipeline via Phaser).
test("sketch diagram loads, color draws, activity completes", async ({ page }) => {
  await page.goto("/play/sketch");
  const canvas = page.locator('div[role="img"] canvas');
  await expect(canvas).toBeVisible({ timeout: 20000 });

  // Guide + canvas have real dimensions (never zero-sized).
  const box = await canvas.boundingBox();
  expect(box && box.width > 200 && box.height > 150).toBeTruthy();

  // Color selection is cosmetic and must not break the pipeline.
  const red = page.getByRole("button", { name: /red crayon/i });
  await expect(red).toBeVisible();
  await red.click();
  await expect(red).toHaveAttribute("aria-pressed", "true");

  // Draw a diagonal stroke across the canvas center.
  const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await page.mouse.move(cx - 80, cy - 40);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(cx - 80 + i * 16, cy - 40 + i * 8, { steps: 2 });
  }
  await page.mouse.up();

  // Submit: either success or gentle retry must appear (pipeline ran).
  await page.getByRole("button", { name: /done/i }).click();
  await expect(page.getByText(/wonderful tracing|nice try/i).first()).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: "test-results/sketch-drawn.png" });
});
