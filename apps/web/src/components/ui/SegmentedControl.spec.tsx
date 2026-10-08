import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
    fireEvent.keyDown(group!, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
