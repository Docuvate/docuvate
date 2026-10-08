const WORKER_API_VERSION = 'v1';

export function workerApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}/${WORKER_API_VERSION}${normalizedPath}`;
}
