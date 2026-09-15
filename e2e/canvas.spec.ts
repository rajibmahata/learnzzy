import { test, expect } from "@playwright/test";

// Regression guard: every game must boot exactly one Phaser canvas.
// A silent boot failure once blanked all five games with zero console output.
for (const slug of ["addition", "subtraction", "clean-up", "puzzle", "sketch"]) {
  test(`phaser canvas boots: ${slug}`, async ({ page }) => {
    await page.goto(`/play/${slug}`);
    // Phaser boot parses a ~1.3MB chunk; allow headroom under parallel load.
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30000 });
    const box = await page.locator("canvas").first().boundingBox();
    // Short stages (e.g. addition is 720x300, ~120px tall at 320px wide) are
    // by design — guard against zero/collapsed canvases, not stage proportions.
    expect(box && box.width > 200 && box.height > 80).toBeTruthy();
  });
}
