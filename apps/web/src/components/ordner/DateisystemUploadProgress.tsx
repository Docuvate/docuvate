import { useTranslation } from 'react-i18next';
import { useDocumentUploadContext } from '../upload/DocumentUploadProvider';

export function DateisystemUploadProgress() {
  const { t } = useTranslation();
  const { queue } = useDocumentUploadContext();
  const active = queue.filter((item) => item.status === 'pending' || item.status === 'uploading');
  if (active.length === 0) return null;

  return (
    <p className="dateisystem-upload-progress" role="status" aria-live="polite">
      {t('upload.feedbackInProgress', { count: active.length })}
    </p>
  );
}
