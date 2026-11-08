// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField, ExtractionBlock } from '@docuvate/contracts';

function fieldsSignature(fields: ExtractedField[]): string {
  return JSON.stringify(
    [...fields]
      .map((f) => ({ key: f.key, value: f.value }))
      .sort((a, b) => a.key.localeCompare(b.key, 'de'))
  );
}

function blocksSignature(blocks: ExtractionBlock[]): string {
  return JSON.stringify(blocks);
}

export function areFieldsDirty(
  fields: ExtractedField[],
  baselineFields: ExtractedField[]
): boolean {
  return fieldsSignature(fields) !== fieldsSignature(baselineFields);
}

export function areBlocksDirty(
  blocks: ExtractionBlock[],
  baselineBlocks: ExtractionBlock[]
): boolean {
  return blocksSignature(blocks) !== blocksSignature(baselineBlocks);
}

/**
 * Blocks to send with a document update. Unchanged blocks are omitted so a metadata
 * save does not rewrite layout text. A real text edit sends the blocks, and the API
 * writes those words into the stored layout instead of deleting it.
 */
export function extractionBlocksForUpdate(
  patchBlocks: ExtractionBlock[] | undefined,
  blocks: ExtractionBlock[],
  baselineBlocks: ExtractionBlock[]
): ExtractionBlock[] | undefined {
  if (patchBlocks !== undefined) return patchBlocks;
  return areBlocksDirty(blocks, baselineBlocks) ? blocks : undefined;
}
