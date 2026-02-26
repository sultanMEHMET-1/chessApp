import { expect, test } from '@playwright/test';

const MOVE_LIST_TEST_ID = 'move-list';
const ANALYSIS_LINE_1 = 'analysis-line-1';
const ANALYSIS_LINE_2 = 'analysis-line-2';
const ANALYSIS_LINE_3 = 'analysis-line-3';
const ANALYSIS_VALUE_INPUT = 'analysis-value';
const ANALYSIS_TOGGLE = 'analysis-toggle';

const MOVE_START = 'square-e2';
const MOVE_END = 'square-e4';

const ANALYSIS_POLL_TIMEOUT = 20_000;
const FAST_ANALYSIS_VALUE = '4';

test('smoke: move shows in history and analysis refreshes', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId(MOVE_START).click();
  await page.getByTestId(MOVE_END).click();

  await expect(page.getByTestId(MOVE_LIST_TEST_ID)).toContainText('e4');

  await page.getByTestId(ANALYSIS_VALUE_INPUT).fill(FAST_ANALYSIS_VALUE);
  await page.getByTestId(ANALYSIS_TOGGLE).click();

  await expect(page.getByTestId(ANALYSIS_LINE_1)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
  await expect(page.getByTestId(ANALYSIS_LINE_2)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
  await expect(page.getByTestId(ANALYSIS_LINE_3)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });

  const lineBefore = await page.getByTestId(ANALYSIS_LINE_1).textContent();

  await page.getByTestId('square-e7').click();
  await page.getByTestId('square-e5').click();

  await expect.poll(async () => page.getByTestId(ANALYSIS_LINE_1).textContent(), {
    timeout: ANALYSIS_POLL_TIMEOUT
  }).not.toBe(lineBefore);
});
