import { test, expect } from "@playwright/test";

// Admin command center loads; education provider endpoints require auth.
test("admin login renders", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /command center|welcome back/i }).first()).toBeVisible({ timeout: 15000 });
});

test("education diagnostics require admin auth", async ({ request }) => {
  for (const url of ["/api/admin/education/providers", "/api/admin/education/health", "/api/admin/education/provenance"]) {
    const res = await request.get(url);
    expect(res.status()).toBe(401);
  }
});

test("public APIs stay open", async ({ request }) => {
  expect((await request.get("/api/health")).status()).toBe(200);
  expect((await request.get("/api/games")).status()).toBe(200);
  expect((await request.get("/api/levels")).status()).toBe(200);
});
