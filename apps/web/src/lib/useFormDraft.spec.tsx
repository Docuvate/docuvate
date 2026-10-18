// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFormDraft } from './useFormDraft';

describe('useFormDraft', () => {
  it('starts clean and marks dirty after edits', () => {
    const { result } = renderHook(() => useFormDraft({ name: 'A' }));
    expect(result.current.dirty).toBe(false);
    act(() => {
      result.current.setDraft({ name: 'B' });
    });
    expect(result.current.dirty).toBe(true);
  });

  it('discards back to saved baseline', () => {
    const { result } = renderHook(() => useFormDraft({ name: 'A' }));
    act(() => {
      result.current.setDraft({ name: 'B' });
    });
    act(() => {
      result.current.discard();
    });
    expect(result.current.draft).toEqual({ name: 'A' });
    expect(result.current.dirty).toBe(false);
  });

  it('commit clears dirty state', () => {
    const { result } = renderHook(() => useFormDraft({ name: 'A' }));
    act(() => {
      result.current.setDraft({ name: 'C' });
    });
    act(() => {
      result.current.commit();
    });
    expect(result.current.dirty).toBe(false);
    expect(result.current.draft).toEqual({ name: 'C' });
  });

  it('resets when baseline prop changes', () => {
    const { result, rerender } = renderHook(({ baseline }) => useFormDraft(baseline), {
      initialProps: { baseline: { name: 'A' } },
    });
    act(() => {
      result.current.setDraft({ name: 'B' });
    });
    rerender({ baseline: { name: 'Z' } });
    expect(result.current.draft).toEqual({ name: 'Z' });
    expect(result.current.dirty).toBe(false);
  });
});
