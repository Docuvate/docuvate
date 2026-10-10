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

import { ToastItem } from './ToastItem';

type ToastKind = 'success' | 'error';

interface ToastRecord {
  id: string;
  kind: ToastKind;
  message: string;
  retry?: () => void;
}

interface ToastContextValue {
  pushSuccess: (message?: string) => void;
  pushError: (message: string, retry?: () => void) => void;
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
    (message?: string) => {
      const id = nextToastId();
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, kind: 'success', message: message ?? t('save.saved') },
      ]);
    },
    [t]
  );

  const pushError = useCallback((message: string, retry?: () => void) => {
    const id = nextToastId();
    setToasts((prev) => [...prev.slice(-2), { id, kind: 'error', message, retry }]);
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
      success: (message?: string) => { pushSuccess(message); },
      error: (message: string, retry?: () => void) => { pushError(message, retry); },
    }),
    [pushSuccess, pushError]
  );
}

export function ToastGlobalBridge() {
  const { pushSuccess, pushError } = useToastNotify();

  useEffect(() => {
    function onSaved(e: Event) {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      pushSuccess(detail?.message);
    }
    function onError(e: Event) {
      const detail = (e as CustomEvent<{ message: string; retry?: () => void }>).detail;
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
