import { expect, test } from "@playwright/test";

test("loads the app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Chess App" })
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("complementary")).toBeVisible();
});
