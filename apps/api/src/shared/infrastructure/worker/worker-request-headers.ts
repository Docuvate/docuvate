export function workerRequestHeaders(contentType = 'application/json'): Record<string, string> {
  return {
    'Content-Type': contentType,
    'X-Worker-Secret': process.env['WORKER_SECRET'] ?? 'worker-shared-secret',
  };
}
