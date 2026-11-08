// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useState } from 'react';

import type { StructuringAspect } from './structuringAspects';
import {
  aspectForPrimary,
  commandForPrimary,
  type StructuringCommand,
  type StructuringPrimary,
} from './structuringRibbon';

/** One primary mode for the document ribbon, shared by the page and the viewer. */
export function useStructuringPrimary(): {
  primary: StructuringPrimary | null;
  textOpen: boolean;
  textEditing: boolean;
  activeAspect: StructuringAspect | null;
  onTextOpenChange: (open: boolean) => void;
  setTextEditing: (editing: boolean) => void;
  select: (primary: StructuringPrimary) => StructuringCommand;
} {
  const [primary, setPrimary] = useState<StructuringPrimary | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [textEditing, setTextEditing] = useState(false);

  const onTextOpenChange = useCallback((open: boolean) => {
    if (open) {
      setPrimary('text');
      setTextOpen(true);
      setTextEditing(true);
      return;
    }
    setTextOpen(false);
    setTextEditing(false);
    setPrimary((current) => {
      if (current === 'text') return null;
      return current;
    });
  }, []);

  const select = useCallback((next: StructuringPrimary) => {
    const command = commandForPrimary(next);
    setPrimary(command.primary);
    const editing = command.stage === 'text';
    setTextOpen(editing);
    setTextEditing(editing);
    return command;
  }, []);

  return {
    primary,
    textOpen,
    textEditing,
    activeAspect: primary ? aspectForPrimary(primary) : null,
    onTextOpenChange,
    setTextEditing,
    select,
  };
}
