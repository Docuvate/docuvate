// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { AlertCircle, CircleCheck } from 'lucide-react';
import { type KeyboardEvent,useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';

export const TOAST_AUTO_DISMISS_MS = 3000;

interface ToastItemProps {
  id: string;
  kind: 'success' | 'error';
  message: string;
  retry?: () => void;
  onDismiss: (id: string) => void;
}

export function ToastItem({ id, kind, message, retry, onDismiss }: ToastItemProps) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const dismissAtRef = useRef(Date.now() + TOAST_AUTO_DISMISS_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pausedAtRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const scheduleDismiss = useCallback(() => {
    clearTimer();
    const ms = dismissAtRef.current - Date.now();
    if (ms <= 0) {
      onDismiss(id);
      return;
    }
    timerRef.current = setTimeout(() => { onDismiss(id); }, ms);
  }, [clearTimer, id, onDismiss]);

  useEffect(() => {
    dismissAtRef.current = Date.now() + TOAST_AUTO_DISMISS_MS;
    scheduleDismiss();
    return clearTimer;
  }, [scheduleDismiss, clearTimer]);

  function onPointerEnter() {
    if (pausedAtRef.current !== null) {
      return;
    }
    pausedAtRef.current = Date.now();
    clearTimer();
  }

  function onPointerLeave() {
    if (pausedAtRef.current === null) {
      return;
    }
    dismissAtRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = null;
    scheduleDismiss();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Escape') {
      return;
    }
    const root = rootRef.current;
    if (!root?.contains(document.activeElement)) {
      return;
    }
    e.preventDefault();
    onDismiss(id);
  }

  const Icon = kind === 'success' ? CircleCheck : AlertCircle;

  return (
    <div
      ref={rootRef}
      className={`toast toast--${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      aria-atomic="true"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
    >
      <Icon className="toast-icon" size={18} strokeWidth={2.25} aria-hidden />
      <span className="toast-message">{message}</span>
      {retry ? (
        <Button type="button" variant="ghost" className="toast-retry" onClick={retry}>
          {t('save.retry')}
        </Button>
      ) : null}
    </div>
  );
}
