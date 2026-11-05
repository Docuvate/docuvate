import { describe, expect, it } from 'vitest';
import { computeRetryDelayMs, documentExtractionIdempotencyKey } from './job-outbox.types.js';

describe('job-outbox domain helpers', () => {
  it('builds a stable idempotency key per document', () => {
    expect(documentExtractionIdempotencyKey('doc-1')).toBe('document-extraction:doc-1');
  });

  it('uses exponential backoff capped at 60 seconds', () => {
    expect(computeRetryDelayMs(1)).toBe(2_000);
    expect(computeRetryDelayMs(2)).toBe(4_000);
    expect(computeRetryDelayMs(3)).toBe(8_000);
    expect(computeRetryDelayMs(10)).toBe(60_000);
  });
});
