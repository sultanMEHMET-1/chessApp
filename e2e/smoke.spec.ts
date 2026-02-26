import { expect, test } from '@playwright/test';

test.skip('smoke: app shell', async ({ page }) => {
  // TODO: Replace once the UI scaffold exists.
  await page.setContent('<main data-testid="app">Chess App</main>');
  await expect(page.getByTestId('app')).toHaveText('Chess App');
});
