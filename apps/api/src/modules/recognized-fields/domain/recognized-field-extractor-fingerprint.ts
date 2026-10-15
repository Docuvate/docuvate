// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LABEL_FIELD_EXTRACTOR_SOURCE = join(
  __dirname,
  '../../../../../worker/src/docuvate_worker/infrastructure/extractors/label_custom_fields.py'
);

/** SHA-256 of worker label-field extractor logic; update when `label_custom_fields.py` changes. */
export const RECOGNIZED_FIELD_EXTRACTOR_LOGIC_SHA256 =
  '90c95f098a2ccc352ebb6c4bb8a3a1b7779e06e4cb3fafd778c83bcfdd8bc2ee';

export function fingerprintToExtractorVersion(sha256Hex: string): number {
  const slice = sha256Hex.slice(0, 7);
  return parseInt(slice, 16);
}

export const RECOGNIZED_FIELD_EXTRACTOR_VERSION = fingerprintToExtractorVersion(
  RECOGNIZED_FIELD_EXTRACTOR_LOGIC_SHA256
);

export function sha256HexFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function readLiveRecognizedFieldExtractorSha256(): string {
  return sha256HexFile(LABEL_FIELD_EXTRACTOR_SOURCE);
}
