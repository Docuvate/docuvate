// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import '../i18n';

import { colorCatalog, tokenCatalog } from '@docuvate/tokens';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { StylesDocsPage } from './StylesDocsPage';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

function renderCatalog() {
  return render(
    <MemoryRouter>
      <StylesDocsPage />
    </MemoryRouter>
  );
}

describe('StylesDocsPage (design-system catalog)', () => {
  it('renders every static token and colour role from the generated catalog', () => {
    renderCatalog();
    const catalog = screen.getByTestId('styles-catalog');
    const text = catalog.textContent;
    for (const token of tokenCatalog) {
      expect(text, token.cssVar).toContain(token.cssVar);
    }
    for (const color of colorCatalog) {
      expect(text, color.cssVar).toContain(color.cssVar);
    }
  });

  it('documents usage guidelines with states and do / don’t for each component', () => {
    renderCatalog();
    const components = screen.getByRole('heading', { level: 2, name: 'Components' }).closest('section');
    expect(components).not.toBeNull();
    if (!components) return;
    const guides = components.querySelectorAll('.styles-guide');
    expect(guides.length).toBeGreaterThanOrEqual(10);
    for (const guide of guides) {
      if (!(guide instanceof HTMLElement)) continue;
      const scoped = within(guide);
      expect(scoped.getByRole('heading', { level: 4, name: 'States' })).not.toBeNull();
      expect(scoped.getByRole('heading', { level: 4, name: 'Do' })).not.toBeNull();
      expect(scoped.getByRole('heading', { level: 4, name: 'Don’t' })).not.toBeNull();
    }
  });

  it('keeps a single h1 on the page (previews use h2)', () => {
    renderCatalog();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows the frozen brand accent value', () => {
    renderCatalog();
    expect(screen.getAllByText(/#d9480f \/ #d9480f/).length).toBeGreaterThan(0);
  });
});
