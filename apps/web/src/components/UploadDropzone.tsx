import { useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UPLOAD_ACCEPT } from '../lib/documentUploadConstants';
import { useDocumentUploadContext } from './upload/DocumentUploadProvider';
import { UploadFeedbackBanner } from './upload/UploadFeedbackBanner';
import { UploadQueueList } from './upload/UploadQueueList';
import { UploadCompactBar } from './UploadCompactBar';
import { Button } from './ui/Button';

interface UploadDropzoneProps {
  /** When true, show a compact bar until expanded. */
  compact?: boolean;
}

export function UploadDropzone({ compact = false }: UploadDropzoneProps) {
  const { t } = useTranslation();
  const { dropTarget, queue, enqueueFiles } = useDocumentUploadContext();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      enqueueFiles(files, dropTarget.assignment);
    },
    [dropTarget.assignment, enqueueFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length) void processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const active = dragOver;
  const uploadBusy = queue.some(
    (item) => item.status === 'pending' || item.status === 'uploading'
  );
  const showFullDropzone = !compact || expanded || active || uploadBusy;

  return (
    <div className={`upload-section${compact ? ' upload-section-compact' : ''}`}>
      {compact && !showFullDropzone ? <UploadCompactBar onExpand={() => setExpanded(true)} /> : null}
      {showFullDropzone ? (
        <div
          className={`dropzone${active ? ' dropzone-active' : ''}${compact ? ' dropzone-compact-mode' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          role="region"
          aria-label={t('upload.regionAria')}
        >
          <p className="dropzone-title">{t('upload.dropTitle')}</p>
          <p className="muted dropzone-hint">{t('upload.dropHint')}</p>
          <Button
            type="button"
            variant="secondary"
            data-ux="primary-action"
            onClick={() => inputRef.current?.click()}
          >
            {t('upload.chooseFiles')}
          </Button>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={UPLOAD_ACCEPT}
            multiple
            className="sr-only"
            aria-label={t('upload.chooseFilesAria')}
            onChange={(e) => {
              if (e.target.files?.length) void processFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      ) : null}

      {compact && showFullDropzone && !active && !uploadBusy ? (
        <Button type="button" variant="ghost" className="upload-collapse-btn" onClick={() => setExpanded(false)}>
          {t('upload.collapseBar')}
        </Button>
      ) : null}

      <UploadQueueList />
      <UploadFeedbackBanner />
    </div>
  );
}
