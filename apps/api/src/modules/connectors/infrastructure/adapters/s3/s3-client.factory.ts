import * as Minio from 'minio';
import type { ConnectorConfigurationInput } from '../../../domain/connector.types.js';

export interface S3ConnectorConfig {
  bucket: string;
  client: Minio.Client;
}

function parseEndpoint(endpointUrl: string): { host: string; port: number; useSSL: boolean } {
  const parsed = new URL(endpointUrl);
  const useSSL = parsed.protocol === 'https:';
  const port = parsed.port ? Number(parsed.port) : useSSL ? 443 : 80;
  return { host: parsed.hostname, port, useSSL };
}

export function createS3ClientConfig(
  credentials: ConnectorConfigurationInput
): S3ConnectorConfig {
  const bucket = credentials['bucket']?.trim() ?? '';
  const region = credentials['region']?.trim() ?? '';
  const accessKey = credentials['access_key_id']?.trim() ?? '';
  const secretKey = credentials['secret_access_key']?.trim() ?? '';
  const endpoint = credentials['endpoint']?.trim();
  const pathStyle = credentials['path_style']?.trim().toLowerCase() === 'true';

  let client: Minio.Client;
  if (endpoint) {
    const { host, port, useSSL } = parseEndpoint(endpoint);
    client = new Minio.Client({
      endPoint: host,
      port,
      useSSL,
      accessKey,
      secretKey,
      region,
      pathStyle,
    });
  } else {
    client = new Minio.Client({
      endPoint: 's3.amazonaws.com',
      port: 443,
      useSSL: true,
      accessKey,
      secretKey,
      region,
    });
  }

  return { bucket, client };
}

export async function validateS3BucketAccess(client: Minio.Client, bucket: string): Promise<void> {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    throw new Error('S3_BUCKET_NOT_FOUND');
  }
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const stream = client.listObjects(bucket, '', true);
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      stream.removeAllListeners();
      if (err) reject(err);
      else resolve();
    };
    stream.on('data', () => finish());
    stream.on('error', (err: Error) => finish(err));
    stream.on('end', () => finish());
  });
}
