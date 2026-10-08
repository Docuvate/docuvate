import { describe, expect, it } from 'vitest';
import {
  showUploadProgressBar,
  uploadProgressFillClass,
  uploadProgressFillWidthPercent,
} from './uploadQueueProgress';

describe('uploadQueueProgress', () => {
  it('hides the progress bar when upload is done', () => {
    expect(showUploadProgressBar('done')).toBe(false);
    expect(uploadProgressFillClass('done')).toBe('upload-queue-progress-done');
  });

  it('shows full-width bar for errors', () => {
    expect(showUploadProgressBar('error')).toBe(true);
    expect(uploadProgressFillWidthPercent('error')).toBe(100);
  });

  it('uses partial width while uploading', () => {
    expect(uploadProgressFillClass('uploading')).toBe('upload-queue-progress-uploading');
    expect(uploadProgressFillWidthPercent('uploading')).toBe(50);
  });
});
