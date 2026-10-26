// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, Loader2, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Popover } from '../ui/overlay/Popover';
import { Button } from '../ui/Button';
import { useDocumentUploadContext } from './DocumentUploadProvider';
import {
  showUploadProgressBar,
  uploadProgressFillClass,
  uploadProgressFillWidthPercent,
} from './uploadQueueProgress';

const VISIBLE_UPLOAD_ITEMS = 12;

interface UploadQueueListProps {
  className?: string;
}

function UploadQueueRow({
  item,
  onDismiss,
}: {
  item: ReturnType<typeof useDocumentUploadContext>['queue'][number];
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className={`upload-queue-item upload-${item.status}`}>
      <span className="upload-queue-item-leading" aria-hidden>
        {item.status === 'uploading' || item.status === 'pending' ? (
          <Loader2 className="upload-queue-icon upload-queue-icon-spin" size={16} strokeWidth={2} />
        ) : null}
        {item.status === 'done' ? (
          <Check className="upload-queue-icon upload-queue-icon-done" size={16} strokeWidth={2} />
        ) : null}
        {item.status === 'error' ? (
          <span className="upload-queue-icon upload-queue-icon-error">!</span>
        ) : null}
      </span>
      <div className="upload-queue-item-body">
        <span className="upload-queue-name">{item.file.name}</span>
        {showUploadProgressBar(item.status) ? (
          <div
            className="upload-queue-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadProgressFillWidthPercent(item.status)}
            aria-label={t('upload.progressAria', { name: item.file.name })}
          >
            <span
              className={`upload-queue-progress-fill ${uploadProgressFillClass(item.status)}`}
              style={{ width: `${String(uploadProgressFillWidthPercent(item.status))}%` }}
            />
          </div>
        ) : null}
        <span className="upload-queue-status">
          {item.status === 'pending' && t('upload.statusPending')}
          {item.status === 'uploading' && t('upload.statusUploading')}
          {item.status === 'done' && t('upload.statusDone')}
          {item.status === 'error' && (item.error ?? t('upload.statusError'))}
        </span>
      </div>
      {item.status === 'done' || item.status === 'error' ? (
        <button
          type="button"
          className="upload-queue-dismiss"
          aria-label={t('upload.dismissItem', { name: item.file.name })}
          onClick={onDismiss}
        >
          <X size={16} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </li>
  );
}

export function UploadQueueList({ className }: UploadQueueListProps) {
  const { t } = useTranslation();
  const { queue, clearTerminalItems, removeUploadItem } = useDocumentUploadContext();
  const overflowButtonRef = useRef<HTMLButtonElement>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const popoverId = useId();
  if (queue.length === 0) return null;

  const hasTerminal = queue.some((item) => item.status === 'done' || item.status === 'error');
  const visible = queue.slice(0, VISIBLE_UPLOAD_ITEMS);
  const overflow = queue.slice(VISIBLE_UPLOAD_ITEMS);

  return (
    <section
      className={`upload-queue-panel${className ? ` ${className}` : ''}`}
      aria-label={t('upload.regionAria')}
    >
      <div className="upload-queue-panel-head">
        <span className="upload-queue-panel-title">{t('upload.queuePanelTitle')}</span>
        {hasTerminal ? (
          <Button
            type="button"
            variant="ghost"
            className="upload-queue-clear"
            onClick={clearTerminalItems}
          >
            {t('upload.clearFinished')}
          </Button>
        ) : null}
      </div>
      <ul className="upload-queue" aria-live="polite">
        {visible.map((item) => (
          <UploadQueueRow
            key={item.id}
            item={item}
            onDismiss={() => { removeUploadItem(item.id); }}
          />
        ))}
        {overflow.length > 0 ? (
          <li className="upload-queue-more">
            <button
              ref={overflowButtonRef}
              type="button"
              className="chip chip-outline upload-queue-overflow-btn"
              aria-expanded={overflowOpen}
              aria-controls={popoverId}
              aria-label={t('upload.queueMoreAria', { count: overflow.length })}
              onClick={() => { setOverflowOpen((open) => !open); }}
            >
              +{overflow.length}
            </button>
            <Popover
              open={overflowOpen}
              onOpenChange={setOverflowOpen}
              referenceRef={overflowButtonRef}
              returnFocusRef={overflowButtonRef}
              portalLayer="popover"
              className="upload-queue-overflow-popover popover-surface popover-surface-scroll"
              id={popoverId}
              role="region"
              aria-label={t('upload.queueOverflowPopoverAria')}
              onEscape={() => { setOverflowOpen(false); }}
            >
              <ul className="upload-queue upload-queue-overflow-list">
                {overflow.map((item) => (
                  <UploadQueueRow
                    key={item.id}
                    item={item}
                    onDismiss={() => { removeUploadItem(item.id); }}
                  />
                ))}
              </ul>
            </Popover>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
