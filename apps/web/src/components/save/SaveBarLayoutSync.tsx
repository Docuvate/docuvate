// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect } from 'react';

/** Keeps fixed SaveBar aligned with `.app-main` when the sidebar resizes. */
export function SaveBarLayoutSync() {
  useEffect(() => {
    const mainEl = document.querySelector('.app-main');
    if (!(mainEl instanceof HTMLElement)) {
      return undefined;
    }
    const main = mainEl;

    function update() {
      const rect = main.getBoundingClientRect();
      document.documentElement.style.setProperty('--save-bar-left', `${rect.left}px`);
      document.documentElement.style.setProperty('--save-bar-width', `${rect.width}px`);
    }

    update();
    const observer = new ResizeObserver(update);
    observer.observe(main);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return null;
}
