// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { NestFactory } from '@nestjs/core';
import pg from 'pg';

import { AppModule } from '../../apps/api/dist/app.module.js';
import { CreateLibraryChatThreadUseCase } from '../../apps/api/dist/modules/chat/application/create-library-chat-thread.use-case.js';
import { SendLibraryChatThreadMessageUseCase } from '../../apps/api/dist/modules/chat/application/send-library-chat-thread-message.use-case.js';
import { CitedChatGenerationService } from '../../apps/api/dist/modules/cited-chat/application/cited-chat-generation.service.js';
import { ListDocumentChatThreadMessagesUseCase } from '../../apps/api/dist/modules/documents/application/list-document-chat-thread-messages.use-case.js';

const LAB_EMAIL = process.env.DOCUVATE_TEST_EMAIL ?? 'thomas@docuvate.test';

const PROBES = [
  {
    key: 'lohnsteuer_2024_total',
    title: 'ext-lohnsteuer-2024',
    question:
      'Wie viel Lohnsteuer wurde mir laut Lohnsteuerbescheinigung 2024 insgesamt einbehalten?',
    pass: (content: string, quotes: string[]) => {
      const hay = `${content}\n${quotes.join('\n')}`.toLowerCase();
      return (
        hay.includes('lohnsteuer') &&
        (hay.includes('16.066,47') || hay.includes('16066,47') || hay.includes('16.066.47'))
      );
    },
  },
  {
    key: 'lohnsteuer_2023_total',
    title: 'ext-lohnsteuer-2023',
    question:
      'Wie viel Lohnsteuer wurde mir laut Lohnsteuerbescheinigung 2023 insgesamt einbehalten?',
    pass: (content: string, quotes: string[]) => {
      const hay = `${content}\n${quotes.join('\n')}`.toLowerCase();
      return (
        hay.includes('lohnsteuer') &&
        (hay.includes('6.224,00') || hay.includes('6224,00') || hay.includes('6.224.00'))
      );
    },
  },
  {
    key: 'oktober_2024_gesamtbrutto',
    title: 'ext-oktober-brutto',
    question: 'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?',
    pass: (content: string, quotes: string[]) => {
      const hay = `${content}\n${quotes.join('\n')}`;
      return hay.includes('4.859,67') || hay.includes('4859,67') || hay.includes('4859.67');
    },
  },
] as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL required');
  }
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
  const userRow = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE lower(email) = lower($1) LIMIT 1`,
    [LAB_EMAIL]
  );
  const userId = userRow.rows[0]?.id;
  if (!userId) {
    throw new Error('lab user not found');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const out: Record<string, number> = {};
  try {
    const createThread = app.get(CreateLibraryChatThreadUseCase);
    const sendMessage = app.get(SendLibraryChatThreadMessageUseCase);
    const listMessages = app.get(ListDocumentChatThreadMessagesUseCase);
    const citedGeneration = app.get(CitedChatGenerationService);

    for (const probe of PROBES) {
      const thread = await createThread.execute(userId, probe.title);
      const sent = await sendMessage.execute(thread.id, userId, probe.question);
      const assistantId = sent.assistantMessage.id;
      await citedGeneration.generate({
        messageId: assistantId,
        threadId: thread.id,
        userId,
        userMessage: probe.question,
        documentIds: [],
        scope: 'library',
        locale: 'de',
      });
      const messages = await listMessages.executeLibrary(thread.id, userId);
      const assistant = messages.find((m) => m.id === assistantId);
      const content = assistant?.content ?? '';
      const quotes = assistant?.citations?.map((c) => c.quote) ?? [];
      out[probe.key] = probe.pass(content, quotes) ? 1 : 0;
    }
  } finally {
    await app.close();
    await pool.end();
  }
  console.log(JSON.stringify(out, null, 2));
}

void main();
