// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { UploadItem } from '../../lib/useDocumentUploadQueue';
import { useDocumentUploadContext } from './DocumentUploadProvider';

const SUCCESS_DISMISS_MS = 6000;

function countByStatus(items: UploadItem[], status: UploadItem['status']): number {
  return items.filter((item) => item.status === status).length;
}

export function UploadFeedbackBanner() {
  const { t } = useTranslation();
  const { queue, clearTerminalItems } = useDocumentUploadContext();
  const dismissTimerRef = useRef<number | null>(null);

  const activeCount = countByStatus(queue, 'pending') + countByStatus(queue, 'uploading');
  const doneCount = countByStatus(queue, 'done');
  const errorCount = countByStatus(queue, 'error');

  useEffect(() => {
    if (activeCount > 0) {
      if (dismissTimerRef.current != null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }

    if (doneCount === 0 && errorCount === 0) {
      return;
    }

    if (dismissTimerRef.current != null) {
      return;
    }

    dismissTimerRef.current = window.setTimeout(() => {
      dismissTimerRef.current = null;
      clearTerminalItems();
    }, SUCCESS_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current != null) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [activeCount, doneCount, errorCount, clearTerminalItems]);

  if (queue.length === 0) {
    return null;
  }

  if (activeCount > 0) {
    return (
      <p className="upload-feedback-banner upload-feedback-banner-active" role="status">
        {t('upload.feedbackInProgress', { count: activeCount })}
      </p>
    );
  }

  if (errorCount > 0 && doneCount === 0) {
    return (
      <p className="upload-feedback-banner upload-feedback-banner-error" role="alert">
        {t('upload.feedbackFailed', { count: errorCount })}
      </p>
    );
  }

  if (errorCount > 0 && doneCount > 0) {
    return (
      <p className="upload-feedback-banner upload-feedback-banner-mixed" role="status">
        {t('upload.feedbackPartial', { done: doneCount, failed: errorCount })}
      </p>
    );
  }

  if (doneCount > 0) {
    return (
      <p className="upload-feedback-banner upload-feedback-banner-success" role="status">
        {t('upload.feedbackSuccess', { count: doneCount })}
      </p>
    );
  }

  return null;
}
