#!/usr/bin/env node
/**
 * Proves F11: pre-fix sample-document enrichment throws RangeError.
 * Run from apps/api: node scripts/prove-main-labels-recommendations-500.mjs
 */
function unfixedEnrich(items, docs) {
  return items.map((item) => {
    const ids = item.sampleDocumentIds ?? [];
    if (ids.length === 0) {
      return item;
    }
    const byId = new Map(docs.map((doc) => [doc.id, doc]));
    const sampleDocuments = [];
    for (const id of ids) {
      const doc = byId.get(id);
      if (!doc) {
        continue;
      }
      sampleDocuments.push({
        documentDate: doc.documentDate ? doc.documentDate.toISOString().slice(0, 10) : null,
      });
    }
    return { ...item, sampleDocuments };
  });
}

const items = [{ id: 'new:1', sampleDocumentIds: ['d1'] }];
const docs = [{ id: 'd1', documentDate: new Date(Number.NaN) }];

let message = '';
try {
  unfixedEnrich(items, docs);
} catch (error) {
  message = error instanceof Error ? error.message : String(error);
}

if (message !== 'Invalid time value') {
  console.error(`Expected "Invalid time value", got: ${message || '(no throw)'}`);
  process.exit(1);
}
console.log(`GET /v1/labels/recommendations enrichment error (pre-fix): ${message}`);
