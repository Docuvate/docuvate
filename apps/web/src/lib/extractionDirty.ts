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

export function isExtractionDirty(
  fields: ExtractedField[],
  blocks: ExtractionBlock[],
  baselineFields: ExtractedField[],
  baselineBlocks: ExtractionBlock[]
): boolean {
  return areFieldsDirty(fields, baselineFields) || areBlocksDirty(blocks, baselineBlocks);
}
