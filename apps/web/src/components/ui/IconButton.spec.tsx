// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render, screen } from '@testing-library/react';
import { Plus } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { ICON_BUTTON_SM_PX, ICON_GLYPH_PX } from './controlMetrics';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders sm hit target with centered 16px icon', () => {
    render(<IconButton icon={Plus} label="Add folder" size="sm" />);
    const btn = screen.getByRole('button', { name: 'Add folder' });
    expect(btn.className).toContain('icon-btn-sm');
    const svg = btn.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(String(ICON_GLYPH_PX));
    expect(svg?.getAttribute('height')).toBe(String(ICON_GLYPH_PX));
    expect(btn.getAttribute('title')).toBe('Add folder');
  });

  it('exposes menu popup semantics only when requested', () => {
    const { rerender } = render(<IconButton icon={Plus} label="Menu plain" size="sm" />);
    expect(
      screen.getByRole('button', { name: 'Menu plain' }).getAttribute('aria-haspopup')
    ).toBeNull();
    rerender(<IconButton icon={Plus} label="Menu popup" size="sm" hasPopup="menu" />);
    expect(screen.getByRole('button', { name: 'Menu popup' }).getAttribute('aria-haspopup')).toBe(
      'menu'
    );
  });
});

describe('IconButton geometry contract', () => {
  it('keeps sm size constant for layout tests', () => {
    expect(ICON_BUTTON_SM_PX).toBe(28);
  });
});
