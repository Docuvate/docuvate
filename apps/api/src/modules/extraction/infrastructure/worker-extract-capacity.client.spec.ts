// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { fetchWorkerExtractCapacity } from './worker-extract-capacity.client.js';

describe('fetchWorkerExtractCapacity', () => {
  it('returns null when the worker is unreachable', async () => {
    await expect(fetchWorkerExtractCapacity('http://127.0.0.1:1')).resolves.toBeNull();
  });
});
