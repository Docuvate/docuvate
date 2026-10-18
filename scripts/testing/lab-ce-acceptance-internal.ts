// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { NestFactory } from '@nestjs/core';
import pg from 'pg';

import { AppModule } from '../../apps/api/dist/app.module.js';
import { CreateLibraryChatThreadUseCase } from '../../apps/api/dist/modules/chat/application/create-library-chat-thread.use-case.js';
import { SendLibraryChatThreadMessageUseCase } from '../../apps/api/dist/modules/chat/application/send-library-chat-thread-message.use-case.js';
import { CitedChatGenerationService } from '../../apps/api/dist/modules/cited-chat/application/cited-chat-generation.service.js';
import { ListDocumentChatThreadMessagesUseCase } from '../../apps/api/dist/modules/documents/application/list-document-chat-thread-messages.use-case.js';
import {
  answerMatchesExpectations,
  citationsMatchFilenamePatterns,
  loadLabCeProbes,
} from './lab-ce-probe-config.mjs';

const LAB_EMAIL = process.env.DOCUVATE_TEST_EMAIL ?? 'thomas@docuvate.test';

async function main(): Promise<void> {
  const probes = loadLabCeProbes();
  if (probes.length === 0) {
    console.log(JSON.stringify({ chat_probes_configured: false }, null, 2));
    return;
  }

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

    /** @type {Record<string, number>} */
    const out: Record<string, number> = { chat_probes_configured: 1 };

    for (const probe of probes) {
      const result = await runQuestion(createThread, sendMessage, listMessages, citedGeneration, userId, {
        title: probe.title,
        question: probe.question,
      });
      const hay = `${result.content}\n${result.quotes.join('\n')}`;
      const amountOk = answerMatchesExpectations(hay, probe.expectContainsAny);
      const filenameOk = citationsMatchFilenamePatterns(
        filenames,
        result.citations,
        probe.filenamePatternRegexes
      );
      out[probe.key] = amountOk && filenameOk ? 1 : 0;
    }

    console.log(JSON.stringify(out, null, 2));
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
