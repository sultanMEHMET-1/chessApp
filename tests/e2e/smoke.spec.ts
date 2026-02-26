import { expect, test } from '@playwright/test';

const MOVE_LIST_TEST_ID = 'move-list';
const SIDE_TO_MOVE_TEST_ID = 'side-to-move';
const ANALYSIS_PANEL_TEST_ID = 'analysis-panel';
const ANALYSIS_LINE_1 = 'analysis-line-1';
const ANALYSIS_LINE_2 = 'analysis-line-2';
const ANALYSIS_LINE_3 = 'analysis-line-3';
const ANALYSIS_VALUE_INPUT = 'analysis-value';
const ANALYSIS_TOGGLE = 'analysis-toggle';

const MOVE_START = 'square-e2';
const MOVE_END = 'square-e4';

const ANALYSIS_POLL_TIMEOUT = 20_000;
const FAST_ANALYSIS_VALUE = '4';
const REQUEST_ID_IDLE = 'idle';

test('smoke: move shows in history and analysis refreshes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId(SIDE_TO_MOVE_TEST_ID)).toBeVisible();

  await page.getByTestId(MOVE_START).click();
  await page.getByTestId(MOVE_END).click();

  await expect(page.getByTestId(MOVE_LIST_TEST_ID)).toContainText('e4');

  await page.getByTestId(ANALYSIS_VALUE_INPUT).fill(FAST_ANALYSIS_VALUE);
  await page.getByTestId(ANALYSIS_TOGGLE).click();

  const analysisPanel = page.getByTestId(ANALYSIS_PANEL_TEST_ID);
  const getRequestId = async () => (await analysisPanel.getAttribute('data-request-id')) ?? '';

  await expect.poll(getRequestId, { timeout: ANALYSIS_POLL_TIMEOUT }).not.toBe(REQUEST_ID_IDLE);

  await expect(page.getByTestId(ANALYSIS_LINE_1)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
  await expect(page.getByTestId(ANALYSIS_LINE_2)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
  await expect(page.getByTestId(ANALYSIS_LINE_3)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });

  const requestIdBefore = await getRequestId();

  await page.getByTestId('square-e7').click();
  await page.getByTestId('square-e5').click();

  await expect.poll(getRequestId, { timeout: ANALYSIS_POLL_TIMEOUT }).not.toBe(requestIdBefore);

  await expect(page.getByTestId(ANALYSIS_LINE_1)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
  await expect(page.getByTestId(ANALYSIS_LINE_2)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
  await expect(page.getByTestId(ANALYSIS_LINE_3)).toBeVisible({ timeout: ANALYSIS_POLL_TIMEOUT });
});
