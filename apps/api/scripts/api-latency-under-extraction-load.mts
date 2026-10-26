#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Samples API latency (p50/p95) while the document-extraction queue has waiting jobs.
 *
 * Env: API_BASE_URL, API_BEARER_TOKEN, SAMPLE_COUNT (default 40), SAMPLE_PATH (default /v1/health)
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function main(): Promise<void> {
  const base = process.env['API_BASE_URL'] ?? 'http://localhost:3000';
  const token = process.env['API_BEARER_TOKEN'] ?? '';
  const path = process.env['SAMPLE_PATH'] ?? '/v1/health';
  const count = Number(process.env['SAMPLE_COUNT'] ?? 40);
  const valkeyUrl = process.env['VALKEY_URL'] ?? 'redis://localhost:6379';

  const { Queue } = await import('bullmq');
  const IORedis = (await import('ioredis')).default;
  const connection = new IORedis(valkeyUrl, { maxRetriesPerRequest: null });
  const extractionQueue = new Queue('document-extraction', { connection });
  const duplicateQueue = new Queue('document-duplicate-detection', { connection });

  const [extractionCounts, duplicateCounts] = await Promise.all([
    extractionQueue.getJobCounts('waiting', 'active', 'delayed'),
    duplicateQueue.getJobCounts('waiting', 'active', 'delayed'),
  ]);

  const durations: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const started = performance.now();
    const response = await fetch(`${base}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)} ${path}`);
    }
    await response.arrayBuffer();
    durations.push(performance.now() - started);
  }

  durations.sort((a, b) => a - b);
  const result = {
    path,
    samples: count,
    p50Ms: Math.round(percentile(durations, 50)),
    p95Ms: Math.round(percentile(durations, 95)),
    maxMs: Math.round(durations[durations.length - 1] ?? 0),
    queues: {
      documentExtraction: extractionCounts,
      documentDuplicateDetection: duplicateCounts,
    },
  };
  console.log(JSON.stringify(result, null, 2));

  await extractionQueue.close();
  await duplicateQueue.close();
  await connection.quit();
}

void main();
