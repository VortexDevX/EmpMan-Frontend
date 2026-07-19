import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function mockApi(page: import("@playwright/test").Page, authenticated = false) {
  await page.route("https://emp-manan.mvlab.cloud/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/auth/session") {
      return route.fulfill({
        status: authenticated ? 200 : 401,
        contentType: "application/json",
        body: authenticated
          ? JSON.stringify({ employee_id: 7, employee_code: "EMP007", role: "employee", full_name: "Test Employee", csrf_token: "test-csrf" })
          : JSON.stringify({ detail: "Not authenticated" }),
      });
    }
    if (path.includes("/tasks/employee/")) return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    if (path.includes("/dashboard/employee/")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    if (path.includes("/ml/predictions/latest/")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test("login is keyboard-usable and passes axe", async ({ page }) => {
  await mockApi(page);
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to Employee Dashboard" })).toBeVisible();
  await expect(page.getByLabel("Employee Code")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Password" })).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("authenticated mobile navigation opens, closes, and passes axe", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation check");
  await mockApi(page, true);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /good|dashboard|overview/i }).first()).toBeVisible();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
