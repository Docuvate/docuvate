// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useState } from 'react';

import { measureBottomSheetToastOffset } from './measureBottomSheetToastOffset';

export function useBottomSheetToastOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => {
      if (typeof document === 'undefined') {
        setOffset(0);
        return;
      }
      setOffset(measureBottomSheetToastOffset());
    };
    update();
    const mutation = new MutationObserver(update);
    mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open'],
    });
    const resize =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resize?.observe(document.body);
    window.addEventListener('resize', update);
    return () => {
      mutation.disconnect();
      resize?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return offset;
}
