#!/usr/bin/env node
/**
 * Ollama stub returning production-like cited JSON ([1] sources, EUR suffix quotes).
 * Used by compose-smoke to ensure citation verification works with real qwen-style output.
 */
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 11434);

const PAYSLIP_CLAIMS = JSON.stringify({
  claims: [
    {
      text: 'Gesamtbrutto: 5.432,10 EUR',
      source: '[1]',
      quote: 'Gesamtbrutto: 5.432,10 EUR',
    },
  ],
});

const GENERIC_CLAIMS = JSON.stringify({
  claims: [
    {
      text: 'Antwort aus dem Modell.',
      source: '[1]',
      quote: '',
    },
  ],
});

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/tags') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ models: [{ name: 'qwen2.5:1.5b' }] }));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const lower = body.toLowerCase();
      const content =
        lower.includes('gesamtbrutto') || lower.includes('entgeltnachweis')
          ? PAYSLIP_CLAIMS
          : GENERIC_CLAIMS;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          message: { role: 'assistant', content },
          done: true,
        })
      );
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`realistic-ollama-stub listening on ${PORT}`);
});
