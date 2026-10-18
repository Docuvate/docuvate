// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect } from 'react';
import { type BlockerFunction,useBlocker } from 'react-router-dom';

export interface UnsavedChangesGuardState {
  /** User tried to leave while dirty; show confirmation UI. */
  pendingNavigation: boolean;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

export function useUnsavedChangesGuard(active: boolean): UnsavedChangesGuardState {
  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      active &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
    [active]
  );

  const blocker = useBlocker(shouldBlock);

  const pendingNavigation = blocker.state === 'blocked';

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => { window.removeEventListener('beforeunload', onBeforeUnload); };
  }, [active]);

  const confirmLeave = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const cancelLeave = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return { pendingNavigation, confirmLeave, cancelLeave };
}
