// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Card, CardHeader } from './Card';
import { InlineStatus } from './InlineStatus';
import { PageHeader } from './PageHeader';
import { ToneBadge } from './ToneBadge';
import { Toolbar, ToolGroup } from './Toolbar';

afterEach(() => {
  cleanup();
});

describe('PageHeader', () => {
  it('renders one h1 marked as page title with lead and actions', () => {
    render(
      <PageHeader
        title="Labels"
        description="Lead text"
        actions={<button type="button">Neues Label</button>}
        className="labels-page-header"
      />
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Labels' });
    expect(heading.getAttribute('data-ux')).toBe('page-title');
    expect(screen.getByText('Lead text').className).toContain('ds-page-header-lead');
    const header = heading.closest('header');
    expect(header?.className).toContain('page-header');
    expect(header?.className).toContain('labels-page-header');
    expect(
      screen.getByRole('button', { name: 'Neues Label' }).closest('.ds-page-header-actions')
    ).not.toBeNull();
  });

  it('can render an h2 without the page-title marker for embedded previews', () => {
    render(<PageHeader title="Preview" titleAs="h2" markAsPageTitle={false} />);
    const heading = screen.getByRole('heading', { level: 2, name: 'Preview' });
    expect(heading.hasAttribute('data-ux')).toBe(false);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });
});

describe('Toolbar', () => {
  it('exposes a labelled group and keeps tool groups as children', () => {
    render(
      <Toolbar aria-label="Filter" justify="between">
        <ToolGroup>
          <button type="button">A</button>
        </ToolGroup>
        <ToolGroup attached>
          <button type="button">B</button>
        </ToolGroup>
      </Toolbar>
    );
    const toolbar = screen.getByRole('group', { name: 'Filter' });
    expect(toolbar.className).toContain('ds-toolbar--between');
    expect(toolbar.querySelectorAll('.ds-tool-group')).toHaveLength(2);
    expect(toolbar.querySelector('.ds-tool-group--attached')).not.toBeNull();
  });

  it('has no group role without an accessible name', () => {
    const { container } = render(
      <Toolbar>
        <ToolGroup>x</ToolGroup>
      </Toolbar>
    );
    expect(container.firstElementChild?.getAttribute('role')).toBeNull();
  });
});

describe('InlineStatus', () => {
  it('announces errors assertively and other tones politely', () => {
    render(
      <>
        <InlineStatus tone="error">Fehler</InlineStatus>
        <InlineStatus tone="success">Gespeichert</InlineStatus>
      </>
    );
    expect(screen.getByRole('alert').textContent).toContain('Fehler');
    expect(screen.getByRole('status').textContent).toContain('Gespeichert');
  });

  it('marks loading as busy and shows a decorative spinner', () => {
    render(<InlineStatus tone="loading">Lädt</InlineStatus>);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-busy')).toBe('true');
    expect(status.querySelector('.spinner[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('ToneBadge and Card', () => {
  it('maps tone to a modifier class on the shared badge', () => {
    render(<ToneBadge tone="warn">Prüfen</ToneBadge>);
    const badge = screen.getByText('Prüfen');
    expect(badge.className).toContain('badge');
    expect(badge.className).toContain('ds-badge--warn');
  });

  it('keeps the default card markup and adds variant/padding modifiers only when set', () => {
    const { container, rerender } = render(<Card className="x">body</Card>);
    expect(container.firstElementChild?.className).toBe('card x');
    rerender(
      <Card variant="muted" padding="sm">
        <CardHeader title="Titel" description="Lead" as="h3" />
      </Card>
    );
    expect(container.firstElementChild?.className).toBe('card card--muted card--pad-sm');
    expect(screen.getByRole('heading', { level: 3, name: 'Titel' })).not.toBeNull();
  });
});
