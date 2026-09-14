import { test, expect } from "@playwright/test";

// Parent surfaces: public info pages, login, and auth gating.
test("public parent pages render", async ({ page }) => {
  await page.goto("/parents");
  await expect(page.getByRole("heading", { name: /for parents/i })).toBeVisible();
  await page.goto("/parents/faq");
  await expect(page.getByRole("heading", { name: /questions, answered/i })).toBeVisible();
  await page.goto("/parents/how-it-works");
  await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
  await page.goto("/parents/how-to-play");
  await expect(page.getByRole("heading", { name: /how to play/i })).toBeVisible();
  await page.goto("/parents/learning");
  await expect(page.getByRole("heading", { name: /learning, gently/i })).toBeVisible();
});

test("parent login validates input", async ({ page }) => {
  await page.goto("/parent/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await page.getByLabel("Email").fill("parent@example.com");
  await page.getByLabel(/password/i).fill("wrong-password-1");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/email or password is incorrect/i)).toBeVisible({ timeout: 10000 });
});

test("parent dashboard requires auth", async ({ page }) => {
  await page.goto("/parent");
  // Unauthenticated parents are redirected to login.
  await expect(page).toHaveURL(/\/parent\/login$/, { timeout: 10000 });
});

test("child cannot use parent APIs", async ({ request }) => {
  for (const url of ["/api/parent/children", "/api/admin/education/health", "/api/admin/education/providers"]) {
    const res = await request.get(url);
    expect(res.status()).toBe(401);
  }
});
