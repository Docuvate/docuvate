// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { createS3ClientConfig } from './s3-client.factory.js';

describe('createS3ClientConfig', () => {
  it('parses custom MinIO endpoint with path-style flag', () => {
    const { bucket, client } = createS3ClientConfig({
      bucket: 'docs',
      region: 'us-east-1',
      access_key_id: 'key',
      secret_access_key: 'secret',
      endpoint: 'https://minio.local:9000',
      path_style: 'true',
    });
    expect(bucket).toBe('docs');
    expect(client).toBeDefined();
  });
});
