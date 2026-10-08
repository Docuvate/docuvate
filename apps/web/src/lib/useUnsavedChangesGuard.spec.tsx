/** @vitest-environment jsdom */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

vi.mock('react-router-dom', () => ({
  useBlocker: () => ({
    state: 'unblocked',
    proceed: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('useUnsavedChangesGuard', () => {
  it('registers beforeunload while active', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useUnsavedChangesGuard(true));
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();
  });

  it('does not register beforeunload when inactive', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useUnsavedChangesGuard(false));
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();
  });

  it('returns leave handlers', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));
    expect(typeof result.current.confirmLeave).toBe('function');
    expect(typeof result.current.cancelLeave).toBe('function');
    expect(result.current.pendingNavigation).toBe(false);
  });
});
