import { expect, test } from "@playwright/test";

test("loads the app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("complementary")).toBeVisible();
import { expect, test } from '@playwright/test';

test.skip('smoke: app shell', async ({ page }) => {
  // TODO: Replace once the UI scaffold exists.
  await page.setContent('<main data-testid="app">Chess App</main>');
  await expect(page.getByTestId('app')).toHaveText('Chess App');
});
