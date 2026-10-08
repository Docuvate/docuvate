import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 768px)';

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useNarrowTopbar(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
