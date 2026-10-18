// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { summarizeLabelAssignmentInventory } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

const seedPath = join(process.cwd(), '../../scripts/seed-labels-screenshots.mjs');

/**
 * Library inventory: 6 current ready documents (newest version each), excluding deleted
 * and stack version rows. Embeddings may still exist for older versions / removed docs — KPI
 * must not use those counts.
 */
describe('seed-labels-screenshots.mjs', () => {
  it('creates document_duplicate_stacks before document_stack_members', () => {
    const source = readFileSync(seedPath, 'utf8');
    const stacksIdx = source.indexOf('document_duplicate_stacks');
    const membersIdx = source.indexOf('INSERT INTO document_stack_members');
    expect(stacksIdx).toBeGreaterThan(-1);
    expect(membersIdx).toBeGreaterThan(stacksIdx);
  });

  it('assigns distinct tag colors for Steuern and Vertrag', () => {
    const source = readFileSync(seedPath, 'utf8');
    const steuernMatch = /tagSteuern, 'Steuern', false, '(#[0-9a-fA-F]{6})'/.exec(source);
    const vertragMatch = /tagVertrag, 'Vertrag', false, '(#[0-9a-fA-F]{6})'/.exec(source);
    const steuernColor = steuernMatch?.[1];
    const vertragColor = vertragMatch?.[1];
    expect(steuernColor).toBeDefined();
    expect(vertragColor).toBeDefined();
    if (steuernColor === undefined || vertragColor === undefined) {
      throw new Error('expected tag color captures');
    }
    expect(steuernColor).not.toBe(vertragColor);
  });
});

describe('summarizeLabelAssignmentInventory', () => {
  it('matches realistic library: 6 docs, 3 labeled, inbox-only unlabeled, versions/deleted excluded', () => {
    const finanzen = { id: 'tag-finanzen', isInbox: false };
    const steuern = { id: 'tag-steuern', isInbox: false };
    const vertrag = { id: 'tag-vertrag', isInbox: false };
    const inbox = { id: 'tag-inbox', isInbox: true };

    // Excluded from library list: doc-v1-old-version (stack role=version), doc-deleted (not ready).
    const libraryDocuments = [
      { id: 'doc-finanzen', tags: [finanzen] },
      { id: 'doc-steuern', tags: [steuern] },
      { id: 'doc-vertrag', tags: [vertrag, inbox] },
      { id: 'doc-inbox-only', tags: [inbox] },
      { id: 'doc-plain-a', tags: [] },
      { id: 'doc-plain-b', tags: [] },
    ];

    const inventory = summarizeLabelAssignmentInventory(libraryDocuments);
    expect(inventory).toEqual({ total: 6, labeled: 3, unlabeled: 3 });

    const wrongEmbeddingRowCount = 18;
    const wrongExplainedSimilarity = 0;
    expect(inventory.labeled + inventory.unlabeled).toBe(inventory.total);
    expect(inventory.total).not.toBe(wrongEmbeddingRowCount);
    expect(inventory.labeled).not.toBe(wrongExplainedSimilarity);
  });

  it('treats inbox-only as unlabeled', () => {
    const inventory = summarizeLabelAssignmentInventory([
      { id: 'd1', tags: [{ id: 'inbox', isInbox: true }] },
    ]);
    expect(inventory).toEqual({ total: 1, labeled: 0, unlabeled: 1 });
  });
});
