// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect } from 'react';
import { useSaveKeyboardShortcut } from '../../lib/useSaveKeyboardShortcut';
import { useUnsavedChangesGuard } from '../../lib/useUnsavedChangesGuard';
import { SaveBar } from './SaveBar';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { useToastNotify } from './ToastProvider';

type PageFormSaveKitProps = {
  dirty: boolean;
  saving: boolean;
  error?: string | null;
  onSave: () => void;
  onDiscard: () => void;
};

/** Wires SaveBar, navigation guard, and Cmd/Ctrl+S for one dirty page form. */
export function PageFormSaveKit({ dirty, saving, error, onSave, onDiscard }: PageFormSaveKitProps) {
  const guard = useUnsavedChangesGuard(dirty && !saving);
  const { dismissSuccessToasts, dismissAllToasts } = useToastNotify();

  useEffect(() => {
    if (dirty) {
      dismissSuccessToasts();
    }
  }, [dirty, dismissSuccessToasts]);

  useEffect(() => {
    if (guard.pendingNavigation) {
      dismissAllToasts();
    }
  }, [guard.pendingNavigation, dismissAllToasts]);

  const handleSave = useCallback(() => {
    if (!dirty || saving) {
      return;
    }
    onSave();
  }, [dirty, saving, onSave]);

  useSaveKeyboardShortcut(dirty && !saving, handleSave);

  return (
    <>
      <SaveBar
        visible={dirty}
        saving={saving}
        error={error}
        onSave={handleSave}
        onDiscard={onDiscard}
      />
      <UnsavedChangesDialog
        open={guard.pendingNavigation}
        onStay={guard.cancelLeave}
        onLeave={guard.confirmLeave}
      />
    </>
  );
}
