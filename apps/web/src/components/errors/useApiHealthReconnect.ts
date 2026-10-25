// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useRef, useState } from 'react';

import { probeApiHealth } from '../../lib/apiHealth';
import { apiHealthBackoffSeconds } from '../../lib/apiHealthBackoff';
import { markApiRequestSucceeded } from '../../lib/serverReachability';

export interface UseApiHealthReconnectOptions {
  enabled: boolean;
  onRecovered?: () => void;
}

export interface ApiHealthReconnectState {
  secondsUntilRetry: number;
  isProbing: boolean;
  attempt: number;
  retryNow: () => void;
}

export function useApiHealthReconnect({
  enabled,
  onRecovered,
}: UseApiHealthReconnectOptions): ApiHealthReconnectState {
  const [attempt, setAttempt] = useState(1);
  const [secondsUntilRetry, setSecondsUntilRetry] = useState(apiHealthBackoffSeconds(1));
  const [isProbing, setIsProbing] = useState(false);
  const attemptRef = useRef(1);
  const onRecoveredRef = useRef(onRecovered);
  onRecoveredRef.current = onRecovered;

  const scheduleNextBackoff = useCallback((nextAttempt: number) => {
    attemptRef.current = nextAttempt;
    setAttempt(nextAttempt);
    setSecondsUntilRetry(apiHealthBackoffSeconds(nextAttempt));
  }, []);

  const runProbe = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setIsProbing(true);
    const result = await probeApiHealth();
    setIsProbing(false);
    if (result.ok) {
      markApiRequestSucceeded();
      onRecoveredRef.current?.();
      attemptRef.current = 1;
      setAttempt(1);
      setSecondsUntilRetry(0);
      return;
    }
    scheduleNextBackoff(attemptRef.current + 1);
  }, [enabled, scheduleNextBackoff]);

  const retryNow = useCallback(() => {
    setSecondsUntilRetry(0);
    void runProbe();
  }, [runProbe]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    scheduleNextBackoff(1);
  }, [enabled, scheduleNextBackoff]);

  useEffect(() => {
    if (!enabled || secondsUntilRetry <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsUntilRetry((value) => Math.max(0, value - 1));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, secondsUntilRetry]);

  useEffect(() => {
    if (!enabled || secondsUntilRetry > 0 || isProbing) {
      return;
    }
    void runProbe();
  }, [enabled, isProbing, runProbe, secondsUntilRetry]);

  return {
    secondsUntilRetry,
    isProbing,
    attempt,
    retryNow,
  };
}
