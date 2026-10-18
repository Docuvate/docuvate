// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  isAllowedUploadMime,
  uploadAcceptAttribute,
} from '@docuvate/contracts';

export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_ACCEPT = uploadAcceptAttribute();

export { isAllowedUploadMime };

export function isFileDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return [...dataTransfer.types].includes('Files');
}
