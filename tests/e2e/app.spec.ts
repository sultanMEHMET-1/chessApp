import { expect, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { App } from '../../src/ui/App';

test('loads the app shell', async ({ page }) => {
  const html = renderToStaticMarkup(createElement(App));

  await page.setContent(`<div id="root">${html}</div>`);
  await expect(page.getByTestId('app-title')).toHaveText('Chess App');
});
