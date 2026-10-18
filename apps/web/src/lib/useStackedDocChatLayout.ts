// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useState } from 'react';

const NARROW_CHAT_MQ = '(max-width: 768px)';

/** Stack thread list behind a toggle on narrow viewports or compact document chat. */
export function useStackedDocChatLayout(compact: boolean) {
  const [narrow, setNarrow] = useState(false);
  const [threadsOpen, setThreadsOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_CHAT_MQ);
    const onChange = () => { setNarrow(mq.matches); };
    onChange();
    mq.addEventListener('change', onChange);
    return () => { mq.removeEventListener('change', onChange); };
  }, []);

  const stacked = compact || narrow;

  const closeThreads = useCallback(() => { setThreadsOpen(false); }, []);
  const openThreads = useCallback(() => { setThreadsOpen(true); }, []);
  const toggleThreads = useCallback(() => { setThreadsOpen((v) => !v); }, []);

  useEffect(() => {
    if (!stacked) {
      setThreadsOpen(false);
    }
  }, [stacked]);

  return {
    stacked,
    threadsOpen,
    closeThreads,
    openThreads,
    toggleThreads,
  };
}
