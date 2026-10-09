import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { DocumentChatMessageRecordDto, DocumentChatThreadDto } from '@docuvate/contracts';
import { formatUserFacingError } from '../lib/apiErrors';
import {
  cancelLibraryChatMessage,
  createLibraryChatThread,
  listLibraryChatThreadMessages,
  listLibraryChatThreads,
  retryLibraryChatMessage,
  sendLibraryChatThreadMessage,
} from '../lib/api';
import { routes } from '../lib/routes';
import { DocumentChatAssistantMessage } from '../components/documents/DocumentChatAssistantMessage';
import { mergeThreadMessagesAfterSend } from '../components/documents/documentChatMessages';
import { useLibraryChatMessageStream } from '../lib/useLibraryChatMessageStream';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

function isGenerationActive(message: DocumentChatMessageRecordDto): boolean {
  return (
    message.role === 'assistant' &&
    (message.generationStatus === 'pending' || message.generationStatus === 'streaming')
  );
}

export function GlobalChatPage() {
  const { t } = useTranslation();
  const [threads, setThreads] = useState<DocumentChatThreadDto[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DocumentChatMessageRecordDto[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const generationInProgress = useMemo(() => messages.some(isGenerationActive), [messages]);

  const upsertMessage = useCallback((next: DocumentChatMessageRecordDto) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === next.id);
      if (idx === -1) {
        return [...prev, next];
      }
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  }, []);

  const { connect: connectStream, stop: stopStream } = useLibraryChatMessageStream(
    activeThreadId,
    upsertMessage
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingThreads(true);
    void listLibraryChatThreads()
      .then((list) => {
        if (cancelled) return;
        setThreads(list);
        if (list.length > 0) {
          setActiveThreadId(list[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(formatUserFacingError(err, 'common.error'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingThreads(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    void listLibraryChatThreadMessages(activeThreadId)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .catch((err) => {
        if (!cancelled) setError(formatUserFacingError(err, 'common.error'));
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [activeThreadId, stopStream]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || generationInProgress) return;

    setError(null);
    try {
      let threadId = activeThreadId;
      if (!threadId) {
        const thread = await createLibraryChatThread({});
        threadId = thread.id;
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(threadId);
      }
      const result = await sendLibraryChatThreadMessage(threadId, { message: trimmed });
      setInput('');
      setMessages((prev) =>
        mergeThreadMessagesAfterSend(prev, '', result.userMessage, result.assistantMessage)
      );
      if (result.asyncGeneration) {
        connectStream(threadId, result.assistantMessage.id);
      }
    } catch (err) {
      setError(formatUserFacingError(err, 'common.error'));
    }
  }

  return (
    <div className="page global-chat-page" data-ux="page">
      <header className="page-header">
        <h1>{t('globalChat.title')}</h1>
        <p className="muted">{t('globalChat.subtitle')}</p>
      </header>

      {error ? (
        <p className="error" role="alert">{error}</p>
      ) : null}

      <div className="global-chat-layout">
        <aside className="global-chat-threads" aria-label={t('globalChat.threads')}>
          {loadingThreads ? <Spinner size="sm" label={t('common.loading')} /> : null}
          <Button type="button" variant="secondary" onClick={() => setActiveThreadId(null)}>
            {t('globalChat.newThread')}
          </Button>
          <ul className="global-chat-thread-list">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  className={`global-chat-thread-btn${thread.id === activeThreadId ? ' active' : ''}`}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  {thread.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="global-chat-panel doc-chat-panel">
          {loadingMessages ? <Spinner size="md" label={t('common.loading')} /> : null}
          <ul className="doc-chat-log">
            {messages.map((message) =>
              message.role === 'assistant' ? (
                <DocumentChatAssistantMessage
                  key={message.id}
                  message={message}
                  onRetry={async (messageId) => {
                    if (!activeThreadId) return;
                    setRetryBusy(true);
                    try {
                      const next = await retryLibraryChatMessage(activeThreadId, messageId);
                      upsertMessage(next);
                      connectStream(activeThreadId, messageId);
                    } finally {
                      setRetryBusy(false);
                    }
                  }}
                  onCancel={async (messageId) => {
                    if (!activeThreadId) return;
                    await cancelLibraryChatMessage(activeThreadId, messageId);
                  }}
                  retryBusy={retryBusy}
                  renderCitationLink={(citation) => (
                    <Link
                      key={citation.ordinal}
                      to={routes.document(citation.documentId)}
                      state={{ highlightBlocks: citation.blocks, citationPage: citation.page }}
                      className="doc-chat-citation-chip"
                    >
                      [{citation.ordinal}]
                    </Link>
                  )}
                />
              ) : (
                <li key={message.id} className="doc-chat-bubble doc-chat-user">
                  <span className="doc-chat-role">{t('documents.documentChat.roleUser')}</span>
                  <p>{message.content}</p>
                </li>
              )
            )}
          </ul>
          <div ref={logEndRef} />
          <form className="doc-chat-compose" onSubmit={onSubmit}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('globalChat.placeholder')}
              disabled={generationInProgress}
              aria-label={t('globalChat.placeholder')}
            />
            <Button type="submit" disabled={generationInProgress || !input.trim()}>
              {t('globalChat.send')}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
