// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { pageMetaForPath } from './lib/pageMeta';
import { prerenderRoutes } from './lib/routes';
import { applyTheme } from './lib/theme';

export { prerenderRoutes };

export function render(url: string): { html: string; helmet: ReturnType<typeof pageMetaForPath> } {
  applyTheme('light');
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
  return { html, helmet: pageMetaForPath(url) };
}
