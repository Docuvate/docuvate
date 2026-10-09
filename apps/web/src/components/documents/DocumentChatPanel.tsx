import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatUserFacingError } from '../../lib/apiErrors';
import type { DocumentChatMessageRecordDto, DocumentChatThreadDto } from '@docuvate/contracts';
import {
  cancelDocumentChatMessage,
  createDocumentChatThread,
  listDocumentChatThreadMessages,
  listDocumentChatThreads,
  retryDocumentChatMessage,
  sendDocumentChatThreadMessage,
} from '../../lib/api';
import { useDocumentChatMessageStream } from '../../lib/useDocumentChatMessageStream';
import { routes } from '../../lib/routes';
import { mergeThreadMessagesAfterSend } from './documentChatMessages';
import { DocumentChatAssistantMessage } from './DocumentChatAssistantMessage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import {
  isChatGenerationInProgress,
  threadListShowsGenerationSpinner,
} from '../../lib/chatGenerationActive';

interface DocumentChatPanelProps {
  documentId: string;
  compact?: boolean;
  chatAvailable?: boolean;
}

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

function DocumentChatEmptyIcon() {
  return (
    <div className="doc-chat-empty-icon" aria-hidden>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path
          d="M8 10a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-9l-6 5v-5H11a3 3 0 0 1-3-3V10Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function DocumentChatPanel({
  documentId,
  compact = false,
  chatAvailable = false,
}: DocumentChatPanelProps) {
  const { t, i18n } = useTranslation();
  const [threads, setThreads] = useState<DocumentChatThreadDto[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DocumentChatMessageRecordDto[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [serviceNotice, setServiceNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const streamTargetRef = useRef<string | null>(null);

  const generationInProgress = useMemo(
    () => isChatGenerationInProgress(messages, loadingMessages),
    [messages, loadingMessages]
  );

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

  const { connect: connectStream, stop: stopStream } = useDocumentChatMessageStream(
    documentId,
    activeThreadId,
    upsertMessage
  );

  const refreshThreads = useCallback(
    async (selectThreadId?: string) => {
      const next = await listDocumentChatThreads(documentId);
      setThreads(next);
      if (selectThreadId) {
        setActiveThreadId(selectThreadId);
      }
    },
    [documentId]
  );

  const attachStreamIfNeeded = useCallback(
    (rows: DocumentChatMessageRecordDto[]) => {
      const active = [...rows]
        .reverse()
        .find(
          (m) =>
            m.role === 'assistant' &&
            (m.generationStatus === 'pending' || m.generationStatus === 'streaming')
        );
      if (active && streamTargetRef.current !== active.id) {
        streamTargetRef.current = active.id;
        connectStream(active.id);
      }
      if (!active) {
        streamTargetRef.current = null;
        stopStream();
      }
    },
    [connectStream, stopStream]
  );

  useEffect(() => {
    if (!chatAvailable) {
      setServiceNotice(false);
    }
  }, [chatAvailable]);

  useEffect(() => {
    let active = true;
    setLoadingThreads(true);
    setError(null);
    void listDocumentChatThreads(documentId)
      .then((next) => {
        if (!active) return;
        setThreads(next);
        setActiveThreadId(next[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            formatUserFacingError(err, 'documents.documentChat.errorLoadThreads')
          );
        }
      })
      .finally(() => {
        if (active) setLoadingThreads(false);
      });
    return () => {
      active = false;
    };
  }, [documentId, t]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      stopStream();
      return undefined;
    }
    let active = true;
    setMessages([]);
    streamTargetRef.current = null;
    stopStream();
    setLoadingMessages(true);
    setError(null);
    void listDocumentChatThreadMessages(documentId, activeThreadId)
      .then((rows) => {
        if (!active) return;
        setMessages(rows);
        attachStreamIfNeeded(rows);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            formatUserFacingError(err, 'documents.documentChat.errorLoadMessages')
          );
          setMessages([]);
        }
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });
    return () => {
      active = false;
      stopStream();
    };
  }, [documentId, activeThreadId, attachStreamIfNeeded, stopStream, t]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, generationInProgress]);

  useEffect(() => {
    if (!generationInProgress) {
      return undefined;
    }
    const id = setInterval(() => {
      void refreshThreads(activeThreadId ?? undefined);
    }, 2500);
    return () => clearInterval(id);
  }, [generationInProgress, refreshThreads, activeThreadId]);

  async function onNewThread() {
    setError(null);
    try {
      const thread = await createDocumentChatThread(documentId);
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
      setMessages([]);
    } catch (err) {
      setError(formatUserFacingError(err, 'documents.documentChat.errorNewThread'));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || generationInProgress || loadingMessages) {
      return;
    }

    let threadId = activeThreadId;
    if (!threadId) {
      try {
        const thread = await createDocumentChatThread(documentId);
        setThreads((prev) => [thread, ...prev]);
        threadId = thread.id;
        setActiveThreadId(thread.id);
      } catch (err) {
        setError(formatUserFacingError(err, 'documents.documentChat.errorNewThread'));
        return;
      }
    }

    if (!threadId) {
      return;
    }

    const sendThreadId = threadId;
    setInput('');
    setError(null);
    try {
      const response = await sendDocumentChatThreadMessage(documentId, sendThreadId, {
        message: text,
      });
      if (response.configured === false) {
        setServiceNotice(true);
      } else {
        setServiceNotice(false);
      }
      setMessages((prev) =>
        mergeThreadMessagesAfterSend(
          prev,
          '',
          response.userMessage,
          response.assistantMessage
        )
      );
      streamTargetRef.current = response.assistantMessage.id;
      connectStream(response.assistantMessage.id);
      await refreshThreads(sendThreadId);
    } catch (err) {
      setError(formatUserFacingError(err, 'documents.documentChat.errorSend'));
    }
  }

  async function onCancelGeneration(messageId: string) {
    if (!activeThreadId) return;
    try {
      await cancelDocumentChatMessage(documentId, activeThreadId, messageId);
    } catch (err) {
      setError(formatUserFacingError(err, 'documents.documentChat.errorCancel'));
    }
  }

  async function onRetry(messageId: string) {
    if (!activeThreadId) return;
    setRetryBusy(true);
    setError(null);
    try {
      const reset = await retryDocumentChatMessage(documentId, activeThreadId, messageId);
      upsertMessage(reset);
      streamTargetRef.current = messageId;
      connectStream(messageId);
      await refreshThreads(activeThreadId);
    } catch (err) {
      setError(formatUserFacingError(err, 'documents.documentChat.errorRetry'));
    } finally {
      setRetryBusy(false);
    }
  }

  const hasThreads = threads.length > 0;
  const showBootstrapEmpty = !loadingThreads && !hasThreads && !loadingMessages && messages.length === 0;
  const showThreadEmpty =
    hasThreads &&
    !loadingMessages &&
    messages.length === 0 &&
    !generationInProgress &&
    activeThreadId != null;
  const panelBusy = loadingThreads || loadingMessages;
  const interactionBlocked = !chatAvailable;
  const dateLocale = i18n.language.startsWith('de') ? 'de-DE' : 'en-US';
  const inputPlaceholder = hasThreads
    ? t('documents.documentChat.inputPlaceholder')
    : t('documents.documentChat.inputPlaceholderBootstrap');

  return (
    <section
      className={`doc-chat${compact ? ' doc-chat-compact' : ''}`}
      aria-labelledby="doc-chat-heading"
      aria-busy={panelBusy || generationInProgress}
    >
      <header className="doc-chat-header detail-section-head">
        <h2 id="doc-chat-heading" className="detail-section-title">
          {t('documents.documentChat.title')}
        </h2>
        <p className="muted detail-section-lead">{t('documents.documentChat.lead')}</p>
        {serviceNotice ? (
          <div className="doc-chat-notice" role="status">
            <p>{t('documents.documentChat.serviceNoticeBody')}</p>
            <Link className="doc-chat-notice-link" to={`${routes.settings}#settings-document-chat`}>
              {t('documents.documentChat.serviceNoticeSettings')}
            </Link>
          </div>
        ) : null}
      </header>

      <div
        className={`doc-chat-layout${hasThreads ? ' doc-chat-layout-split' : ' doc-chat-layout-bootstrap'}`}
      >
        {hasThreads ? (
          <aside className="doc-chat-threads" aria-label={t('documents.documentChat.threadsAria')}>
            <div className="doc-chat-threads-head">
              <span className="doc-chat-threads-label">{t('documents.documentChat.threadsLabel')}</span>
              <Button
                type="button"
                variant="secondary"
                className="doc-chat-new-thread"
                disabled={interactionBlocked}
                onClick={() => void onNewThread()}
              >
                {t('documents.documentChat.newThread')}
              </Button>
            </div>
            {loadingThreads ? (
              <p className="muted doc-chat-threads-loading" role="status">
                <Spinner size="sm" label={t('documents.documentChat.threadsLoading')} />
                <span>{t('documents.documentChat.threadsLoading')}</span>
              </p>
            ) : null}
            <ul className="doc-chat-thread-list">
              {threads.map((thread) => {
                const selected = thread.id === activeThreadId;
                const threadBusy = threadListShowsGenerationSpinner(thread);
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
          <div className={`doc-chat-pane${interactionBlocked ? ' doc-chat-pane-disabled' : ''}`}>
            {interactionBlocked ? (
              <div className="doc-chat-disabled-overlay" role="status">
                <h3 className="doc-chat-disabled-title">
                  {t('documents.documentChat.disabledOverlayTitle')}
                </h3>
                <p className="muted doc-chat-disabled-lead">
                  {t('documents.documentChat.disabledOverlayBody')}
                </p>
                <Link className="doc-chat-notice-link" to={`${routes.settings}#settings-document-chat`}>
                  {t('documents.documentChat.disabledOverlaySettings')}
                </Link>
                <details className="doc-chat-admin-details">
                  <summary>{t('documents.documentChat.disabledOverlayAdminSummary')}</summary>
                  <p className="muted">{t('documents.documentChat.disabledOverlayAdminBody')}</p>
                </details>
              </div>
            ) : null}
            <div className="doc-chat-messages" aria-hidden={interactionBlocked}>
              {loadingThreads && !hasThreads ? (
                <p className="muted doc-chat-messages-loading" role="status">
                  <Spinner size="sm" label={t('documents.documentChat.threadsLoading')} />
                  <span>{t('documents.documentChat.threadsLoading')}</span>
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
                  <DocumentChatEmptyIcon />
                  <h3 className="doc-chat-empty-title">{t('documents.documentChat.bootstrapTitle')}</h3>
                  <p className="muted doc-chat-empty-lead">{t('documents.documentChat.bootstrapLead')}</p>
                  <p className="muted doc-chat-empty-hint">{t('documents.documentChat.bootstrapHint')}</p>
                </div>
              ) : null}

              {showThreadEmpty ? (
                <div className="doc-chat-empty-state doc-chat-empty-state-thread">
                  <p className="muted doc-chat-empty-lead">{t('documents.documentChat.threadEmptyLead')}</p>
                  <p className="muted doc-chat-empty-hint">{t('documents.documentChat.threadEmptyExample')}</p>
                </div>
              ) : null}

              {messages.length > 0 ? (
                <ul className="doc-chat-log" aria-live="polite">
                  {messages.map((msg) =>
                    msg.role === 'assistant' ? (
                      <DocumentChatAssistantMessage
                        key={msg.id}
                        message={msg}
                        onRetry={(id) => void onRetry(id)}
                        onCancel={(id) => void onCancelGeneration(id)}
                        retryBusy={retryBusy}
                      />
                    ) : (
                      <li key={msg.id} className="doc-chat-bubble doc-chat-user">
                        <span className="doc-chat-role">{t('documents.documentChat.roleUser')}</span>
                        <p>{msg.content}</p>
                      </li>
                    )
                  )}
                </ul>
              ) : null}

              <div ref={logEndRef} className="doc-chat-log-anchor" aria-hidden="true" />
            </div>

            {error ? (
              <p id="doc-chat-error" className="error doc-chat-error" role="alert">
                {error}
              </p>
            ) : null}

            <form
              className="doc-chat-composer"
              onSubmit={(e) => void onSubmit(e)}
              aria-hidden={interactionBlocked}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                aria-label={t('documents.documentChat.inputAria')}
                disabled={
                  interactionBlocked ||
                  generationInProgress ||
                  loadingMessages ||
                  (loadingThreads && !hasThreads)
                }
                aria-describedby={error ? 'doc-chat-error' : undefined}
              />
              <Button
                type="submit"
                className="doc-chat-submit"
                disabled={
                  interactionBlocked ||
                  generationInProgress ||
                  loadingMessages ||
                  (loadingThreads && !hasThreads) ||
                  input.trim().length === 0
                }
                aria-busy={generationInProgress}
              >
                {generationInProgress ? (
                  <>
                    <Spinner size="sm" tone="onPrimary" label={t('documents.documentChat.sending')} />
                    <span>{t('documents.documentChat.sending')}</span>
                  </>
                ) : (
                  t('documents.documentChat.send')
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
