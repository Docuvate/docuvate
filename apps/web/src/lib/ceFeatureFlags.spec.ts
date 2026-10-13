// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isCeSourceConnectorPlugin } from './ceFeatureFlags';

describe('isCeSourceConnectorPlugin', () => {
  it('matches paperless and sftp_fetch only', () => {
    expect(isCeSourceConnectorPlugin('paperless')).toBe(true);
    expect(isCeSourceConnectorPlugin('sftp_fetch')).toBe(true);
    expect(isCeSourceConnectorPlugin('gmail')).toBe(false);
  });
});
