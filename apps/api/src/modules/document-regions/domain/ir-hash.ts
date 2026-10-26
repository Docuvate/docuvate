// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createHash } from 'node:crypto';

export function hashLayoutIrBytes(ir: unknown): Buffer {
  return createHash('sha256').update(JSON.stringify(ir), 'utf8').digest();
}

export function hashLayoutIrHex(ir: unknown): string {
  return hashLayoutIrBytes(ir).toString('hex');
}

export function hashFieldValueBytes(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function hashFieldValueHex(value: string): string {
  return hashFieldValueBytes(value).toString('hex');
}

export function bufferToHex(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('hex');
  }
  return '';
}
