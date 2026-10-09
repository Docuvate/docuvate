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

function formatThreadMeta(thread: DocumentChatThreadDto, locale: string): string {
  const date = new Date(thread.updatedAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isGenerationActive(message: DocumentChatMessageRecordDto): boolean {
  return (
    message.role === 'assistant' &&
    (message.generationStatus === 'pending' || message.generationStatus === 'streaming')
  );
}

export function GlobalChatPage() {
  const { t, i18n } = useTranslation();
  const [threads, setThreads] = useState<DocumentChatThreadDto[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DocumentChatMessageRecordDto[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const streamTargetRef = useRef<string | null>(null);

  const generationInProgress = useMemo(() => messages.some(isGenerationActive), [messages]);
  const hasThreads = threads.length > 0;
  const dateLocale = i18n.language.startsWith('de') ? 'de-DE' : 'en-US';

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

  const refreshThreads = useCallback(async (selectThreadId?: string) => {
    const list = await listLibraryChatThreads();
    setThreads(list);
    if (selectThreadId) {
      setActiveThreadId(selectThreadId);
    }
  }, []);

  const attachStreamIfNeeded = useCallback(
    (rows: DocumentChatMessageRecordDto[]) => {
      const active = [...rows].reverse().find(isGenerationActive);
      if (active && activeThreadId && streamTargetRef.current !== active.id) {
        streamTargetRef.current = active.id;
        connectStream(activeThreadId, active.id);
      }
    },
    [activeThreadId, connectStream]
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
      streamTargetRef.current = null;
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    void listLibraryChatThreadMessages(activeThreadId)
      .then((list) => {
        if (cancelled) return;
        setMessages(list);
        attachStreamIfNeeded(list);
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
  }, [activeThreadId, attachStreamIfNeeded, stopStream]);

  useEffect(() => {
    if (!generationInProgress) {
      return undefined;
    }
    const id = setInterval(() => {
      void refreshThreads(activeThreadId ?? undefined);
    }, 2500);
    return () => clearInterval(id);
  }, [generationInProgress, refreshThreads, activeThreadId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function onNewThread() {
    setError(null);
    try {
      const thread = await createLibraryChatThread({});
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
      setMessages([]);
      streamTargetRef.current = null;
    } catch (err) {
      setError(formatUserFacingError(err, 'documents.documentChat.errorNewThread'));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || generationInProgress || loadingMessages) {
      return;
    }

    setError(null);
    try {
      let threadId = activeThreadId;
      if (!threadId) {
        const thread = await createLibraryChatThread({});
        threadId = thread.id;
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(threadId);
      }
      const sendThreadId = threadId;
      if (!sendThreadId) {
        return;
      }
      const result = await sendLibraryChatThreadMessage(sendThreadId, { message: trimmed });
      setInput('');
      setMessages((prev) =>
        mergeThreadMessagesAfterSend(prev, '', result.userMessage, result.assistantMessage)
      );
      if (result.asyncGeneration) {
        streamTargetRef.current = result.assistantMessage.id;
        connectStream(sendThreadId, result.assistantMessage.id);
      }
      await refreshThreads(sendThreadId);
    } catch (err) {
      setError(formatUserFacingError(err, 'common.error'));
    }
  }

  const showBootstrapEmpty =
    !loadingThreads && !hasThreads && !loadingMessages && messages.length === 0;
  const showThreadEmpty =
    hasThreads &&
    !loadingMessages &&
    messages.length === 0 &&
    !generationInProgress &&
    activeThreadId != null;

  return (
    <div className="page global-chat-page" data-ux="page">
      <header className="page-header global-chat-page-header">
        <div>
          <h1 id="global-chat-heading" data-ux="page-title">{t('globalChat.title')}</h1>
          <p className="muted">{t('globalChat.subtitle')}</p>
        </div>
      </header>

      {error ? (
        <p className="error" role="alert">{error}</p>
      ) : null}

      <section className="doc-chat global-chat-doc-chat" aria-labelledby="global-chat-heading">
        <div
          className={`doc-chat-layout${hasThreads ? ' doc-chat-layout-split' : ' doc-chat-layout-bootstrap'}`}
        >
          {hasThreads ? (
            <aside className="doc-chat-threads" aria-label={t('globalChat.threads')}>
              <div className="doc-chat-threads-head">
                <span className="doc-chat-threads-label">{t('globalChat.threads')}</span>
                <Button
                  type="button"
                  variant="secondary"
                  className="doc-chat-new-thread"
                  onClick={() => void onNewThread()}
                >
                  {t('globalChat.newThread')}
                </Button>
              </div>
              {loadingThreads ? (
                <p className="muted doc-chat-threads-loading" role="status">
                  <Spinner size="sm" label={t('common.loading')} />
                  <span>{t('common.loading')}</span>
                </p>
              ) : null}
              <ul className="doc-chat-thread-list">
                {threads.map((thread) => {
                  const selected = thread.id === activeThreadId;
                  const threadBusy =
                    thread.activeGenerationStatus === 'pending' ||
                    thread.activeGenerationStatus === 'streaming';
                  return (
                    <li key={thread.id}>
                      <button
                        type="button"
                        className={`doc-chat-thread-item${selected ? ' active' : ''}`}
                        aria-current={selected ? 'true' : undefined}
                        onClick={() => setActiveThreadId(thread.id)}
                      >
                        <span className="doc-chat-thread-title-row">
                          <span className="doc-chat-thread-title">{thread.title}</span>
                          {threadBusy ? (
                            <Spinner
                              size="sm"
                              className="doc-chat-thread-status"
                              label={t('documents.documentChat.threadGenerating')}
                            />
                          ) : null}
                        </span>
                        {thread.lastMessagePreview ? (
                          <span className="doc-chat-thread-preview">{thread.lastMessagePreview}</span>
                        ) : null}
                        <span className="doc-chat-thread-meta">
                          {formatThreadMeta(thread, dateLocale)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
          ) : null}

          <div className="doc-chat-conversation">
            <div className="doc-chat-pane global-chat-pane">
              <div className="doc-chat-messages">
                {loadingThreads && !hasThreads ? (
                  <p className="muted doc-chat-messages-loading" role="status">
                    <Spinner size="sm" label={t('common.loading')} />
                    <span>{t('common.loading')}</span>
                  </p>
                ) : null}

                {loadingMessages ? (
                  <p className="muted doc-chat-messages-loading" role="status">
                    <Spinner size="sm" label={t('documents.documentChat.messagesLoading')} />
                    <span>{t('documents.documentChat.messagesLoading')}</span>
                  </p>
                ) : null}

                {showBootstrapEmpty ? (
                  <div className="doc-chat-empty-state doc-chat-empty-state-bootstrap">
                    <p className="muted doc-chat-empty-lead">{t('globalChat.bootstrapLead')}</p>
                    <p className="muted doc-chat-empty-hint">{t('globalChat.placeholder')}</p>
                  </div>
                ) : null}

                {showThreadEmpty ? (
                  <div className="doc-chat-empty-state doc-chat-empty-state-thread">
                    <p className="muted doc-chat-empty-lead">{t('documents.documentChat.threadEmptyLead')}</p>
                  </div>
                ) : null}

                {messages.length > 0 ? (
                  <ul className="doc-chat-log" aria-live="polite">
                    {messages.map((message) =>
                      message.role === 'assistant' ? (
                        <DocumentChatAssistantMessage
                          key={message.id}
                          message={message}
                          chatScope="library"
                          onRetry={async (messageId) => {
                            if (!activeThreadId) return;
                            setRetryBusy(true);
                            try {
                              const next = await retryLibraryChatMessage(activeThreadId, messageId);
                              upsertMessage(next);
                              streamTargetRef.current = messageId;
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
                ) : null}

                <div ref={logEndRef} className="doc-chat-log-anchor" aria-hidden="true" />
              </div>

              <form className="doc-chat-composer" onSubmit={(e) => void onSubmit(e)}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('globalChat.placeholder')}
                  disabled={generationInProgress || loadingMessages}
                  aria-label={t('globalChat.placeholder')}
                />
                <Button
                  type="submit"
                  className="doc-chat-submit"
                  disabled={generationInProgress || loadingMessages || !input.trim()}
                  aria-busy={generationInProgress}
                >
                  {generationInProgress ? (
                    <>
                      <Spinner size="sm" tone="onPrimary" label={t('documents.documentChat.sending')} />
                      <span>{t('documents.documentChat.sending')}</span>
                    </>
                  ) : (
                    t('globalChat.send')
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
