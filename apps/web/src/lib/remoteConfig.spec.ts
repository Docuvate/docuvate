// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { isSourceConnectorPlugin } from './remoteConfig';

describe('isSourceConnectorPlugin', () => {
  it('matches paperless and sftp_fetch only', () => {
    expect(isSourceConnectorPlugin('paperless')).toBe(true);
    expect(isSourceConnectorPlugin('sftp_fetch')).toBe(true);
    expect(isSourceConnectorPlugin('gmail')).toBe(false);
  });
});
