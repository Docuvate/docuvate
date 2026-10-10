// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { isRecord } from './json.js';

export function parseInjectJsonBody(response: { json: () => unknown }): Record<string, unknown> | null {
  const body = response.json();
  if (!isRecord(body)) {
    return null;
  }
  return body;
}
