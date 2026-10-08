import type { UploadItemStatus } from '../../lib/useDocumentUploadQueue';

export function uploadProgressFillClass(status: UploadItemStatus): string {
  if (status === 'error') return 'upload-queue-progress-error';
  if (status === 'done') return 'upload-queue-progress-done';
  return `upload-queue-progress-${status}`;
}

/** Done/error bars are full width; active uploads use partial/indeterminate styles. */
export function uploadProgressFillWidthPercent(status: UploadItemStatus): number {
  if (status === 'error') return 100;
  if (status === 'uploading') return 50;
  if (status === 'pending') return 8;
  return 100;
}

export function showUploadProgressBar(status: UploadItemStatus): boolean {
  return status === 'pending' || status === 'uploading' || status === 'error';
}
