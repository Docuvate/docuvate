// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import type { ObjectStorage } from '../../domain/ports.js';
import { createMinioClientOptionsFromEnv } from './minio-client.config.js';

@Injectable()
export class MinioObjectStorage implements ObjectStorage {
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env['MINIO_BUCKET'] ?? 'documents';
    this.client = new Minio.Client(createMinioClientOptionsFromEnv());
  }

  async putObject(key: string, data: Buffer, mimeType: string): Promise<void> {
    await this.client.putObject(this.bucket, key, data, data.length, {
      'Content-Type': mimeType,
    });
  }

  async getObject(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];
    return await new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
