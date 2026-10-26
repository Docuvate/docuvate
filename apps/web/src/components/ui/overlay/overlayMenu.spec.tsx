// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Menu, MenuContent, MenuTrigger } from './Menu';
import { Popover } from './Popover';

function FlipFixture() {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);

  return (
    <div style={{ position: 'fixed', left: 0, bottom: 0 }}>
      <button ref={anchorRef} type="button">Anchor</button>
      <Popover
        open={open}
        onOpenChange={setOpen}
        referenceRef={anchorRef}
        className="popover-surface"
        role="listbox"
        placement="bottom-start"
      >
        <ul>
          <li>One</li>
          <li>Two</li>
        </ul>
      </Popover>
    </div>
  );
}

describe('overlay Popover', () => {
  it('flips above the anchor when there is no room below', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement
    ) {
      if (this.tagName === 'BUTTON') {
        return {
          x: 8,
          y: 820,
          width: 200,
          height: 40,
          top: 820,
          left: 8,
          right: 208,
          bottom: 860,
          toJSON: () => ({}),
        };
      }
      return {
        x: 8,
        y: 400,
        width: 200,
        height: 160,
        top: 400,
        left: 8,
        right: 208,
        bottom: 560,
        toJSON: () => ({}),
      };
    });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });

    render(<FlipFixture />);
    await waitFor(() => {
      const placement =
        document.querySelector('[data-floating-placement]')?.getAttribute('data-floating-placement') ??
        '';
      expect(placement.startsWith('top')).toBe(true);
    });

    vi.restoreAllMocks();
  });
});

describe('overlay Menu', () => {
  it('closes on Escape and returns focus to the trigger', () => {
    render(
      <Menu>
        <MenuTrigger className="menu-trigger">More</MenuTrigger>
        <MenuContent className="popover-surface">
          <button type="button" role="menuitem">Action</button>
        </MenuContent>
      </Menu>
    );
    const trigger = screen.getByRole('button', { name: 'More' });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
