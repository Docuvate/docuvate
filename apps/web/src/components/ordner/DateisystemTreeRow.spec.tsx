// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { DateisystemTreeRow } from './DateisystemTreeRow';

function renderRow(props: Partial<ComponentProps<typeof DateisystemTreeRow>> = {}) {
  return render(
    <MemoryRouter>
      <DateisystemTreeRow
        to="/filesystem/folders/f1"
        isActive={false}
        treeItemId="f:f1"
        chevron={<span data-testid="chevron">›</span>}
        icon={<span data-testid="icon">📁</span>}
        name="Internet"
        count={3}
        actions={<button type="button">⋯</button>}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('DateisystemTreeRow', () => {
  it('renders count in a dedicated column outside the link', () => {
    renderRow();
    const count = screen.getByText('3');
    expect(count.className).toContain('dateisystem-tree-count');
    expect(count.closest('a')).toBeNull();
  });

  it('marks row selected without narrowing highlight to the link', () => {
    const { container } = renderRow({ isActive: true });
    const row = container.querySelector('.dateisystem-tree-row.is-selected');
    expect(row).not.toBeNull();
  });

  it('reserves trailing count and actions overlay', () => {
    const { container } = renderRow();
    expect(container.querySelector('.dateisystem-tree-row-trailing')).not.toBeNull();
    expect(container.querySelector('.dateisystem-tree-actions')).not.toBeNull();
  });

  it('places chevron before the folder link within the indented lead', () => {
    const { container } = renderRow({ depth: 2 });
    const lead = container.querySelector('.dateisystem-tree-row-lead');
    expect(lead).not.toBeNull();
    const chevron = lead?.querySelector('[data-testid="chevron"]');
    const link = lead?.querySelector('a.dateisystem-tree-link');
    expect(chevron).not.toBeNull();
    expect(link).not.toBeNull();
    if (!lead) throw new Error('expected tree row lead');
    const leadChildren = Array.from(lead.children);
    if (!chevron) throw new Error('expected chevron');
    const chevronIndex = leadChildren.findIndex((el) => el.contains(chevron));
    const linkIndex = leadChildren.findIndex((el) => el === link);
    expect(chevronIndex).toBeGreaterThanOrEqual(0);
    expect(chevronIndex).toBeLessThan(linkIndex);
  });
});
