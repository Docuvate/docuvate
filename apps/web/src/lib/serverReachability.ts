// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { probeApiHealth } from './apiHealth';

type Listener = (state: ServerReachabilityState) => void;

export interface ServerReachabilityState {
  /** Browser reports offline (X11). */
  browserOffline: boolean;
  /** API unreachable while browser online (X4). */
  serverUnreachable: boolean;
}

let state: ServerReachabilityState = {
  browserOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  serverUnreachable: false,
};

const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getServerReachabilityState(): ServerReachabilityState {
  return state;
}

export function subscribeServerReachability(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markApiRequestSucceeded(): void {
  if (!state.serverUnreachable) {
    return;
  }
  state = { ...state, serverUnreachable: false };
  emit();
}

export function markApiRequestFailed(err: unknown): void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    state = { ...state, browserOffline: true, serverUnreachable: false };
    emit();
    return;
  }
  if (isLikelyServerUnreachable(err)) {
    state = { ...state, browserOffline: false, serverUnreachable: true };
    emit();
  }
}

function isLikelyServerUnreachable(err: unknown): boolean {
  if (err instanceof TypeError) {
    return true;
  }
  if (err instanceof Error && err.name === 'AbortError') {
    return false;
  }
  return false;
}

export function bindBrowserOnlineListeners(): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  function onOnline() {
    state = { ...state, browserOffline: false };
    emit();
  }
  function onOffline() {
    state = { ...state, browserOffline: true, serverUnreachable: false };
    emit();
  }
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

export async function retryServerConnection(): Promise<void> {
  const result = await probeApiHealth();
  if (result.ok) {
    state = { ...state, serverUnreachable: false };
    emit();
    return;
  }
  state = { ...state, serverUnreachable: true };
  emit();
}
