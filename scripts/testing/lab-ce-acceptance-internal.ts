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
  const filenames = new Map(
    (
      await pool.query<{ id: string; filename: string }>(
        `SELECT id::text AS id, filename FROM documents WHERE user_id = $1`,
        [userId]
      )
    ).rows.map((r) => [r.id, r.filename])
  );

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const createThread = app.get(CreateLibraryChatThreadUseCase);
    const sendMessage = app.get(SendLibraryChatThreadMessageUseCase);
    const listMessages = app.get(ListDocumentChatThreadMessagesUseCase);
    const citedGeneration = app.get(CitedChatGenerationService);

    const october = await runQuestion(createThread, sendMessage, listMessages, citedGeneration, userId, {
      title: 'acceptance-october-gross',
      question: 'Wie hoch war das Gesamtbrutto im Entgeltnachweis Oktober 2024?',
    });
    const tax = await runQuestion(createThread, sendMessage, listMessages, citedGeneration, userId, {
      title: 'acceptance-lohnsteuer-2024',
      question:
        'Wie viel Lohnsteuer wurde mir laut Lohnsteuerbescheinigung 2024 insgesamt einbehalten?',
    });

    const chatOctoberOk =
      (october.content.includes('4.859,67') || october.content.includes('4859,67')) &&
      october.citations.some((c) =>
        /2024_10|2024-10|10[./]2024/i.test(filenames.get(c.documentId) ?? '')
      );
    const taxHay = `${tax.content}\n${tax.quotes.join('\n')}`.toLowerCase();
    const chatTaxOk =
      tax.citations.some((c) => (filenames.get(c.documentId) ?? '') === '2024.pdf') &&
      (taxHay.includes('16.066,47') ||
        taxHay.includes('16066,47') ||
        taxHay.includes('16.066.47')) &&
      taxHay.includes('lohnsteuer');

    if (!chatTaxOk) {
      console.error(
        JSON.stringify({
          tax_debug: {
            content: tax.content.slice(0, 1200),
            citations: tax.citations.map((c) => filenames.get(c.documentId) ?? c.documentId),
          },
        })
      );
    }

    console.log(
      JSON.stringify(
        {
          chat_oktober_gesamtbrutto: chatOctoberOk ? 1 : 0,
          chat_lohnsteuer_2024: chatTaxOk ? 1 : 0,
        },
        null,
        2
      )
    );
  } finally {
    await app.close();
    await pool.end();
  }
}

async function runQuestion(
  createThread: CreateLibraryChatThreadUseCase,
  sendMessage: SendLibraryChatThreadMessageUseCase,
  listMessages: ListDocumentChatThreadMessagesUseCase,
  citedGeneration: CitedChatGenerationService,
  userId: string,
  input: { title: string; question: string }
): Promise<{ content: string; citations: { documentId: string }[]; quotes: string[] }> {
  const thread = await createThread.execute(userId, input.title);
  const sent = await sendMessage.execute(thread.id, userId, input.question);
  const assistantId = sent.assistantMessage.id;
  await citedGeneration.generate({
    messageId: assistantId,
    threadId: thread.id,
    userId,
    userMessage: input.question,
    documentIds: [],
    scope: 'library',
    locale: 'de',
  });
  const messages = await listMessages.executeLibrary(thread.id, userId);
  const assistant = messages.find((m) => m.id === assistantId);
  if (!assistant) {
    throw new Error(`assistant message missing: ${input.title}`);
  }
  const citations = assistant.citations ?? [];
  return {
    content: assistant.content ?? '',
    citations: citations.map((c) => ({ documentId: c.documentId })),
    quotes: citations.map((c) => c.quote),
  };
}

void main();
