// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isErrorScreenPreviewEnabled } from './errorPreviewRoutes';

describe('isErrorScreenPreviewEnabled', () => {
  it('is enabled in dev or screenshot harness builds', () => {
    expect(isErrorScreenPreviewEnabled()).toBe(
      import.meta.env.DEV || import.meta.env.VITE_ERROR_SCREENSHOT_HARNESS === 'true'
    );
  });
});
