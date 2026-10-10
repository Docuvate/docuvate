// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('selects option on click', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="View"
        value="a"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('moves selection with arrow keys', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SegmentedControl
        ariaLabel="View"
        value="a"
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta' },
        ]}
        onChange={onChange}
      />
    );
    const group = container.querySelector('[role="radiogroup"]');
    expect(group).not.toBeNull();
    if (!group) throw new Error('expected radiogroup');
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
