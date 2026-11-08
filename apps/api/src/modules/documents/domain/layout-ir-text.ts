// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';

interface TextEdit {
  page: number;
  blockIndex: number;
  previous: string | null;
  next: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function blockKey(page: number, blockIndex: number): string {
  return `${String(page)}:${String(blockIndex)}`;
}

/**
 * Which stored lines change when the user saves extraction blocks.
 * A block that disappears has its text cleared so the layout does not keep
 * the old words. Geometry is not part of this plan.
 */
function planLayoutTextEdits(
  previous: readonly ExtractionBlock[],
  next: readonly ExtractionBlock[]
): TextEdit[] {
  const prior = new Map<string, ExtractionBlock>();
  for (const block of previous) {
    if (block.blockIndex == null) continue;
    prior.set(blockKey(block.page, block.blockIndex), block);
  }
  const edits: TextEdit[] = [];
  const seen = new Set<string>();
  for (const block of next) {
    if (block.blockIndex == null) continue;
    const key = blockKey(block.page, block.blockIndex);
    seen.add(key);
    const before = prior.get(key);
    edits.push({
      page: block.page,
      blockIndex: block.blockIndex,
      previous: before?.text ?? null,
      next: block.text,
    });
  }
  for (const block of previous) {
    if (block.blockIndex == null) continue;
    const key = blockKey(block.page, block.blockIndex);
    if (seen.has(key)) continue;
    edits.push({
      page: block.page,
      blockIndex: block.blockIndex,
      previous: block.text,
      next: '',
    });
  }
  return edits;
}

function replacement(text: string, page: number | null, blockIndex: number | null, edits: readonly TextEdit[]): string {
  for (const edit of edits) {
    if (page != null && edit.page !== page) continue;
    if (blockIndex != null) {
      if (edit.blockIndex === blockIndex) return edit.next;
      continue;
    }
    if (edit.previous != null && edit.previous.length > 0 && text === edit.previous) {
      return edit.next;
    }
  }
  return text;
}

function rewriteNode(value: unknown, page: number | null, edits: readonly TextEdit[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteNode(item, page, edits));
  }
  if (!isRecord(value)) return value;
  const nextPage = typeof value.page === 'number' ? value.page : page;
  const copy: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    copy[key] = key === 'text' ? child : rewriteNode(child, nextPage, edits);
  }
  if (typeof copy.text !== 'string') return copy;
  const blockIndex = typeof value.blockIndex === 'number' ? value.blockIndex : null;
  copy.text = replacement(copy.text, nextPage, blockIndex, edits);
  return copy;
}

/**
 * Writes corrected OCR text into the stored layout IR and leaves pages,
 * geometry, tables, and vectors in place. Returns the same value when the
 * IR is not an object.
 */
export function rewriteLayoutIrText(
  ir: unknown,
  previous: readonly ExtractionBlock[],
  next: readonly ExtractionBlock[]
): unknown {
  if (!isRecord(ir)) return ir;
  const edits = planLayoutTextEdits(previous, next);
  if (edits.length === 0) return ir;
  return rewriteNode(ir, null, edits);
}
