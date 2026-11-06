// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import i18n from '../../i18n';
import { type PipelineOverview, pipelineTasks } from '../../lib/documentPipeline';
import { DocumentStageTrack } from './DocumentStageTrack';
import { LibraryStageTabs } from './LibraryStageTabs';
import { PipelineRail } from './PipelineRail';
import { PipelineTaskList } from './PipelineTaskList';
import { StagePill } from './StagePill';

const OVERVIEW: PipelineOverview = {
  waiting: 2,
  structuring: 1,
  failed: 1,
  review: 3,
  unlabeled: 1,
  ready: 8,
  total: 12,
};

beforeAll(async () => {
  await i18n.changeLanguage('de');
});

afterEach(() => {
  cleanup();
});

describe('PipelineRail', () => {
  it('links every stage to its filtered list and surfaces failures', () => {
    render(
      <MemoryRouter>
        <PipelineRail overview={OVERVIEW} />
      </MemoryRouter>
    );
    const rail = screen.getByRole('navigation', { name: 'Strukturierungs-Pipeline' });
    const links = within(rail).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/documents?filter=status%3Aqueued',
      '/documents?filter=status%3Aextracting',
      '/documents?filter=status%3Aerror',
      '/review',
      '/documents?filter=status%3Aready',
    ]);
    expect(within(rail).getByText('1 fehlgeschlagen')).toBeTruthy();
    expect(within(rail).getByText('3 Dokumente offen')).toBeTruthy();
  });

  it('hides the failure link when nothing failed', () => {
    render(
      <MemoryRouter>
        <PipelineRail overview={{ ...OVERVIEW, failed: 0, review: 0 }} />
      </MemoryRouter>
    );
    expect(screen.queryByText(/fehlgeschlagen/)).toBeNull();
    expect(screen.getByText('Alles geprüft')).toBeTruthy();
  });
});

describe('PipelineTaskList', () => {
  it('renders the most urgent task first with a primary action', () => {
    render(
      <MemoryRouter>
        <PipelineTaskList tasks={pipelineTasks(OVERVIEW)} />
      </MemoryRouter>
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('3 Dokumente prüfen');
    const action = within(items[0] ?? document.body).getByRole('link');
    expect(action.className).toContain('btn-primary');
    expect(action.getAttribute('href')).toBe('/review');
  });

  it('shows the all-done state', () => {
    render(
      <MemoryRouter>
        <PipelineTaskList tasks={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Alles strukturiert/)).toBeTruthy();
  });
});

describe('DocumentStageTrack / StagePill', () => {
  it('marks the current step for assistive tech', () => {
    render(<DocumentStageTrack state="review" />);
    const track = screen.getByRole('list', { name: 'Fortschritt dieses Dokuments' });
    const current = track.querySelector('[aria-current="step"]');
    expect(current?.getAttribute('data-stage')).toBe('review');
    expect(current?.textContent).toContain('aktueller Schritt');
  });

  it('keeps the status badge hooks next to the stage class', () => {
    const { container } = render(<StagePill state="structured" status="ready" />);
    const pill = container.querySelector('span');
    expect(pill?.className).toContain('badge-ready');
    expect(pill?.className).toContain('pipeline-pill--structured');
    expect(pill?.textContent).toBe('Nichts offen');
  });
});

describe('LibraryStageTabs', () => {
  it('reflects the active filter and patches filters on select', () => {
    const onSelect = vi.fn();
    render(<LibraryStageTabs filters={{ inbox: true }} overview={OVERVIEW} onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^Offen/ }).getAttribute('aria-pressed')).toBe(
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: /Fehler/ }));
    expect(onSelect).toHaveBeenCalledWith({
      inbox: undefined,
      withoutNonInboxLabel: undefined,
      status: 'failed',
    });
    expect(screen.getByRole('button', { name: /Alle/ }).textContent).toContain('12');
  });
});
