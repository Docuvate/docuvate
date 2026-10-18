// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { buildOllamaChatBody } from './ollama-chat-options.js';
import { ollamaChatBaseUrl, ollamaChatConfigured, ollamaChatModel } from './ollama-chat-request.js';

@Injectable()
export class OllamaWarmupService implements OnModuleInit {
  private readonly logger = new Logger(OllamaWarmupService.name);

  onModuleInit(): void {
    void this.warmOllamaModel();
  }

  private async warmOllamaModel(): Promise<void> {
    if (!ollamaChatConfigured()) {
      return;
    }
    const model = ollamaChatModel();
    const url = `${ollamaChatBaseUrl()}/api/chat`;
    const body = buildOllamaChatBody(
      model,
      [{ role: 'user', content: 'ping' }],
      false
    );
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000),
      });
      if (!response.ok) {
        this.logger.warn(`Ollama warmup HTTP ${String(response.status)} for model ${model}`);
        return;
      }
      this.logger.log(`Ollama model preloaded (${model})`);
    } catch (err) {
      this.logger.warn(`Ollama warmup skipped: ${String(err)}`);
    }
  }
}
