#!/usr/bin/env node
/**
 * Minimal Ollama-compatible stub for smoke: returns cited JSON with empty quotes and bogus sources.
 */
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 11434);

const BAD_CLAIMS = JSON.stringify({
  claims: [
    {
      text: 'Antwort aus dem Modell.',
      source: 'S999',
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
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        message: { role: 'assistant', content: BAD_CLAIMS },
        done: true,
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`bad-ollama-stub listening on ${PORT}`);
});
