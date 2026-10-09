// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { GenericContainer, Wait } from 'testcontainers';

export type StartedOllamaStub = {
  baseUrl: string;
  stop: () => Promise<void>;
};

/**
 * Lightweight HTTP stub for Ollama-shaped chat endpoints in CI (no model pull).
 * Returns canned JSON for /api/tags and /api/chat.
 */
export async function startOllamaStubContainer(): Promise<StartedOllamaStub> {
  const container = await new GenericContainer('node:24.21.0-alpine')
    .withExposedPorts(11434)
    .withCommand([
      'node',
      '-e',
      `
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/api/tags') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ models: [{ name: 'qwen2.5:3b-stub' }] }));
    return;
  }
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: { role: 'assistant', content: 'stub reply' } }));
    });
    return;
  }
  res.writeHead(404);
  res.end();
});
server.listen(11434, '0.0.0.0');
`,
    ])
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
  const host = container.getHost();
  const port = container.getMappedPort(11434);
  return {
    baseUrl: `http://${host}:${port}`,
    stop: async () => {
      await container.stop();
    },
  };
}
