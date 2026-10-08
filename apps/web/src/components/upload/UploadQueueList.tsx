import { Check, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { useDocumentUploadContext } from './DocumentUploadProvider';
import {
  showUploadProgressBar,
  uploadProgressFillClass,
  uploadProgressFillWidthPercent,
} from './uploadQueueProgress';

interface UploadQueueListProps {
  className?: string;
}

export function UploadQueueList({ className }: UploadQueueListProps) {
  const { t } = useTranslation();
  const { queue, clearTerminalItems, removeUploadItem } = useDocumentUploadContext();
  if (queue.length === 0) return null;

  const hasTerminal = queue.some((item) => item.status === 'done' || item.status === 'error');

  return (
    <section
      className={`upload-queue-panel${className ? ` ${className}` : ''}`}
      aria-label={t('upload.regionAria')}
    >
      <div className="upload-queue-panel-head">
        <span className="upload-queue-panel-title">{t('upload.queuePanelTitle')}</span>
        {hasTerminal ? (
          <Button type="button" variant="ghost" className="upload-queue-clear" onClick={clearTerminalItems}>
            {t('upload.clearFinished')}
          </Button>
        ) : null}
      </div>
      <ul className="upload-queue" aria-live="polite">
        {queue.slice(0, 12).map((item) => (
          <li key={item.id} className={`upload-queue-item upload-${item.status}`}>
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
                    style={{ width: `${uploadProgressFillWidthPercent(item.status)}%` }}
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
                onClick={() => removeUploadItem(item.id)}
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
        {queue.length > 12 ? (
          <li className="muted upload-queue-more">{t('upload.queueMore', { count: queue.length - 12 })}</li>
        ) : null}
      </ul>
    </section>
  );
}
