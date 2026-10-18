// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { readNotifySavedDetail, readNotifySaveErrorDetail } from '../../lib/customEventDetail';
import { ToastItem } from './ToastItem';

type ToastKind = 'success' | 'error';

export interface ToastErrorMeta {
  retry?: () => void;
  code?: string;
  requestId?: string;
}

interface ToastSuccessOptions {
  undo?: () => void;
}

interface ToastRecord {
  id: string;
  kind: ToastKind;
  message: string;
  retry?: () => void;
  undo?: () => void;
  code?: string;
  requestId?: string;
}

interface ToastContextValue {
  pushSuccess: (message?: string, options?: ToastSuccessOptions) => void;
  pushError: (message: string, retryOrMeta?: (() => void) | ToastErrorMeta) => void;
  dismissSuccessToasts: () => void;
  dismissAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function nextToastId(): string {
  return `toast-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushSuccess = useCallback(
    (message?: string, options?: ToastSuccessOptions) => {
      const id = nextToastId();
      setToasts((prev) => [
        ...prev.slice(-2),
        {
          id,
          kind: 'success',
          message: message ?? t('save.saved'),
          undo: options?.undo,
        },
      ]);
    },
    [t]
  );

  const pushError = useCallback((message: string, retryOrMeta?: (() => void) | ToastErrorMeta) => {
    const id = nextToastId();
    let retry: (() => void) | undefined;
    let code: string | undefined;
    let requestId: string | undefined;
    if (typeof retryOrMeta === 'function') {
      retry = retryOrMeta;
    } else if (retryOrMeta) {
      retry = retryOrMeta.retry;
      code = retryOrMeta.code;
      requestId = retryOrMeta.requestId;
    }
    setToasts((prev) => [...prev.slice(-2), { id, kind: 'error', message, retry, code, requestId }]);
  }, []);

  const dismissSuccessToasts = useCallback(() => {
    setToasts((prev) => prev.filter((item) => item.kind !== 'success'));
  }, []);

  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo(
    () => ({ pushSuccess, pushError, dismissSuccessToasts, dismissAllToasts }),
    [pushSuccess, pushError, dismissSuccessToasts, dismissAllToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-region">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              id={toast.id}
              kind={toast.kind}
              message={toast.message}
              retry={toast.retry}
              undo={toast.undo}
              code={toast.code}
              requestId={toast.requestId}
              onDismiss={removeToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToastNotify(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastNotify requires ToastProvider');
  }
  return ctx;
}

/** Preferred app toast API (#82 and save flows). Requires `ToastProvider` in `AppShell`. */
export function useToast() {
  const { pushSuccess, pushError } = useToastNotify();
  return useMemo(
    () => ({
      success: (message?: string, options?: ToastSuccessOptions) => { pushSuccess(message, options); },
      error: (message: string, retryOrMeta?: (() => void) | ToastErrorMeta) => {
        pushError(message, retryOrMeta);
      },
    }),
    [pushSuccess, pushError]
  );
}

export function ToastGlobalBridge() {
  const { pushSuccess, pushError } = useToastNotify();

  useEffect(() => {
    function onSaved(e: Event) {
      const detail = readNotifySavedDetail(e);
      if (!detail) return;
      pushSuccess(detail.message, detail.undo ? { undo: detail.undo } : undefined);
    }
    function onError(e: Event) {
      const detail = readNotifySaveErrorDetail(e);
      if (!detail) return;
      pushError(detail.message, detail.retry);
    }
    window.addEventListener('docuvate-notify-saved', onSaved);
    window.addEventListener('docuvate-notify-save-error', onError);
    return () => {
      window.removeEventListener('docuvate-notify-saved', onSaved);
      window.removeEventListener('docuvate-notify-save-error', onError);
    };
  }, [pushSuccess, pushError]);

  return null;
}
