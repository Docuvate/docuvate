// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useMemo, useState } from 'react';

import { defaultFormDraftEqual } from './formDraftEqual';

function serializeBaseline<T>(value: T): string {
  return JSON.stringify(value);
}

export interface UseFormDraftOptions<T> {
  isEqual?: (a: T, b: T) => boolean;
}

export function useFormDraft<T>(baseline: T, options?: UseFormDraftOptions<T>) {
  const isEqual = options?.isEqual ?? defaultFormDraftEqual;
  const [saved, setSaved] = useState(baseline);
  const [draft, setDraft] = useState(baseline);

  const baselineKey = serializeBaseline(baseline);
  useEffect(() => {
    setSaved(baseline);
    setDraft(baseline);
    // baselineKey captures semantic changes; baseline is read from the render that changed the key.
  }, [baselineKey]);

  const dirty = useMemo(() => !isEqual(draft, saved), [draft, saved, isEqual]);

  const discard = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  const commit = useCallback(
    (next?: T) => {
      const value = next ?? draft;
      setSaved(value);
      setDraft(value);
    },
    [draft]
  );

  return {
    draft,
    setDraft,
    saved,
    dirty,
    discard,
    commit,
  };
}
