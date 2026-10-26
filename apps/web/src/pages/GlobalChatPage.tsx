// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentChatMessageRecordDto,
  DocumentChatThreadDto,
  UserSettingsDto,
} from '@docuvate/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { GlobalChatEmptyState } from '../components/chat/GlobalChatEmptyState';
import { GlobalChatNotReadyPanel } from '../components/chat/GlobalChatNotReadyPanel';
import { GlobalChatThreadRow } from '../components/chat/GlobalChatThreadRow';
import { DocumentChatAssistantMessage } from '../components/documents/DocumentChatAssistantMessage';
import { mergeThreadMessagesAfterSend } from '../components/documents/documentChatMessages';
import { useToastNotify } from '../components/save/ToastProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import {
  cancelLibraryChatMessage,
  createLibraryChatThread,
  deleteLibraryChatThread,
  getGlobalChatSuggestionBootstrap,
  getUserSettings,
  listLibraryChatThreadMessages,
  retryLibraryChatMessage,
  sendLibraryChatThreadMessage,
  updateLibraryChatThread,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { useLibraryChatThreadsInfiniteQuery } from '../lib/chat/useLibraryChatThreadsInfiniteQuery';
import { isChatGenerationInProgress } from '../lib/chatGenerationActive';
import { showThreadListSpinner } from '../lib/chatThreadSpinner';
import { buildGlobalChatSuggestionsFromBootstrap } from '../lib/globalChatSuggestionsFromBootstrap';
import { flattenCursorPages } from '../lib/pagination/useCursorInfiniteQuery';
import { useCursorLoadMoreSentinel } from '../lib/pagination/useCursorLoadMoreSentinel';
import { routes } from '../lib/routes';
import { useLibraryChatMessageStream } from '../lib/useLibraryChatMessageStream';
import { useStackedDocChatLayout } from '../lib/useStackedDocChatLayout';

const CHAT_THREAD_ROW_ESTIMATE_PX = 68;
const CHAT_THREAD_VIRTUAL_THRESHOLD = 20;

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

export function GlobalChatPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pushSuccess } = useToastNotify();
  const queryClient = useQueryClient();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DocumentChatMessageRecordDto[]>([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryBusy, setRetryBusy] = useState(false);
  const [chatUiEnabled, setChatUiEnabled] = useState(true);
  const [threadSearch, setThreadSearch] = useState('');
  const [composerDraftActive, setComposerDraftActive] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettingsDto | null>(null);
  const [suggestionChips, setSuggestionChips] = useState<
    ReturnType<typeof buildGlobalChatSuggestionsFromBootstrap>['chips']
  >([]);
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const threadListScrollRef = useRef<HTMLDivElement | null>(null);
  const streamTargetRef = useRef<string | null>(null);

  const threadsQuery = useLibraryChatThreadsInfiniteQuery(chatUiEnabled);
  const threads = flattenCursorPages(threadsQuery.data?.pages);
  const loadingThreads = chatUiEnabled && threadsQuery.isLoading;

  const generationInProgress = useMemo(
    () => isChatGenerationInProgress(messages, loadingMessages),
    [messages, loadingMessages]
  );
  const { stacked, threadsOpen, toggleThreads, closeThreads } = useStackedDocChatLayout(false);
  const hasThreads = threads.length > 0;
  const filteredThreads = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) {
      return threads;
    }
    return threads.filter((thread) => {
      const haystack = `${thread.title} ${thread.lastMessagePreview ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [threadSearch, threads]);
  const useThreadVirtual = filteredThreads.length > CHAT_THREAD_VIRTUAL_THRESHOLD;
  const threadVirtualizer = useVirtualizer({
    count: filteredThreads.length,
    getScrollElement: () => threadListScrollRef.current,
    estimateSize: () => CHAT_THREAD_ROW_ESTIMATE_PX,
    overscan: 8,
  });
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

  const refreshThreads = useCallback(
    async (selectThreadId?: string) => {
      await queryClient.invalidateQueries({ queryKey: ['library-chat-threads'] });
      if (selectThreadId) {
        setActiveThreadId(selectThreadId);
      }
    },
    [queryClient]
  );

  useCursorLoadMoreSentinel({
    containerRef: threadListScrollRef,
    hasNextPage: threadsQuery.hasNextPage,
    isFetchingNextPage: threadsQuery.isFetchingNextPage,
    fetchNextPage: () => {
      void threadsQuery.fetchNextPage();
    },
  });

  const attachStreamIfNeeded = useCallback(
    (rows: DocumentChatMessageRecordDto[]) => {
      const active = [...rows].reverse().find(
        (m) =>
          m.role === 'assistant' &&
          (m.generationStatus === 'pending' || m.generationStatus === 'streaming')
      );
      if (active && activeThreadId && streamTargetRef.current !== active.id) {
        streamTargetRef.current = active.id;
        connectStream(activeThreadId, active.id);
        return;
      }
      if (!active) {
        streamTargetRef.current = null;
        stopStream();
      }
    },
    [activeThreadId, connectStream, stopStream]
  );

  const reloadSettings = useCallback(() => {
    void getUserSettings()
      .then((settings) => {
        setUserSettings(settings);
        setChatUiEnabled(settings.documentChatUiEnabled !== false);
      })
      .catch(() => {
        setChatUiEnabled(true);
        setUserSettings(null);
      });
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  useEffect(() => {
    if (!chatUiEnabled) {
      setActiveThreadId(null);
      setMessages([]);
    }
  }, [chatUiEnabled]);

  useEffect(() => {
    if (threadsQuery.isError) {
      setError(formatUserFacingError(threadsQuery.error, 'common.error'));
    }
  }, [threadsQuery.error, threadsQuery.isError]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      streamTargetRef.current = null;
      return;
    }
    let cancelled = false;
    setMessages([]);
    streamTargetRef.current = null;
    stopStream();
    setLoadingMessages(true);
    void listLibraryChatThreadMessages(activeThreadId)
      .then((list) => {
        if (cancelled) return;
        setMessages(list);
        attachStreamIfNeeded(list);
      })
      .catch((err: unknown) => {
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
    if (!generationInProgress && activeThreadId) {
      void refreshThreads(activeThreadId);
    }
  }, [generationInProgress, activeThreadId, refreshThreads]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function onRenameThread(threadId: string, nextTitle: string) {
    const previousTitle = threads.find((row) => row.id === threadId)?.title ?? '';
    setError(null);
    try {
      await updateLibraryChatThread(threadId, nextTitle);
      await refreshThreads(threadId);
      pushSuccess(undefined, {
        undo: () => {
          void updateLibraryChatThread(threadId, previousTitle).then(() => refreshThreads(threadId));
        },
      });
    } catch (err) {
      setError(formatUserFacingError(err, 'common.error'));
    }
  }

  async function onDeleteThread(threadId: string) {
    setError(null);
    try {
      await deleteLibraryChatThread(threadId);
      await refreshThreads();
      if (activeThreadId === threadId) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(formatUserFacingError(err, 'common.error'));
    }
  }

  function onNewThread() {
    setError(null);
    setActiveThreadId(null);
    setMessages([]);
    setInput('');
    setComposerDraftActive(true);
    streamTargetRef.current = null;
    stopStream();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || generationInProgress) {
      return;
    }
    if (loadingMessages && activeThreadId) {
      return;
    }

    setError(null);
    try {
      let threadId = activeThreadId;
      if (!threadId) {
        const thread = await createLibraryChatThread({});
        threadId = thread.id;
        setActiveThreadId(threadId);
        setComposerDraftActive(false);
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
    !loadingThreads &&
    !hasThreads &&
    !loadingMessages &&
    messages.length === 0 &&
    !composerDraftActive;
  const showThreadEmpty =
    hasThreads &&
    !loadingMessages &&
    messages.length === 0 &&
    !generationInProgress &&
    activeThreadId != null;
  const showPanePickThread =
    hasThreads &&
    !loadingThreads &&
    activeThreadId == null &&
    messages.length === 0 &&
    !composerDraftActive;
  const showComposerDraft =
    composerDraftActive && activeThreadId == null && messages.length === 0;
  const chatReadiness = userSettings?.documentChatReadiness ?? 'ready';
  const chatProviderOff =
    userSettings?.customerChatProvider === 'off' || userSettings?.preferredChatProvider === 'off';
  const showChatNotReady = chatUiEnabled && !chatProviderOff && chatReadiness !== 'ready';
  const composerEnabled =
    chatUiEnabled && !showChatNotReady && !generationInProgress && !(loadingMessages && !!activeThreadId);

  useEffect(() => {
    if (!chatUiEnabled || showChatNotReady) return;
    if (!(showBootstrapEmpty || showComposerDraft)) return;
    let cancelled = false;
    setLoadingSuggestions(true);
    void getGlobalChatSuggestionBootstrap()
      .then((bootstrap) => {
        if (cancelled) return;
        const built = buildGlobalChatSuggestionsFromBootstrap(bootstrap);
        setSuggestionChips(built.chips);
        setRecentQuestions(built.recentQuestions);
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestionChips([]);
          setRecentQuestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    chatUiEnabled,
    showChatNotReady,
    showBootstrapEmpty,
    showComposerDraft,
    dateLocale,
  ]);

  return (
    <div className="page global-chat-page" data-ux="page">
      <header className="page-header global-chat-page-header">
        <div>
          <h1 id="global-chat-heading" data-ux="page-title">
            {t('globalChat.title')}
          </h1>
          <p className="muted">{t('globalChat.subtitle')}</p>
        </div>
      </header>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="doc-chat global-chat-doc-chat" aria-labelledby="global-chat-heading">
        {!chatUiEnabled ? (
          <div className="doc-chat-disabled-overlay global-chat-disabled" role="status">
            <h2 className="doc-chat-disabled-title">{t('documents.documentChat.disabledSettingsTitle')}</h2>
            <p className="muted">{t('documents.documentChat.disabledSettingsBody')}</p>
            <Link className="doc-chat-notice-link" to={`${routes.settings}#settings-document-chat`}>
              {t('documents.documentChat.disabledOverlaySettings')}
            </Link>
          </div>
        ) : null}
        <div
          className={`doc-chat-layout${hasThreads ? ' doc-chat-layout-split' : ' doc-chat-layout-bootstrap'}${stacked && hasThreads ? ' doc-chat-layout-stacked' : ''}${stacked && threadsOpen ? ' doc-chat-threads-visible' : ''}${!chatUiEnabled ? ' doc-chat-layout-disabled' : ''}`}
          aria-hidden={!chatUiEnabled}
        >
          {stacked && hasThreads ? (
            <div className="doc-chat-threads-toolbar">
              <Button
                type="button"
                variant="secondary"
                className="doc-chat-threads-toggle"
                onClick={toggleThreads}
              >
                {t('globalChat.threadsToggle')}
              </Button>
            </div>
          ) : null}
          {hasThreads ? (
            <aside className="doc-chat-threads" aria-label={t('globalChat.threads')}>
              <div className="doc-chat-threads-head global-chat-threads-head">
                <Button
                  type="button"
                  variant="secondary"
                  className="doc-chat-new-thread"
                  onClick={() => { onNewThread(); }}
                >
                  {t('globalChat.newThread')}
                </Button>
                <Input
                  className="doc-chat-thread-search"
                  value={threadSearch}
                  onChange={(e) => { setThreadSearch(e.target.value); }}
                  placeholder={t('globalChat.threadSearchPlaceholder')}
                  aria-label={t('globalChat.threadSearchPlaceholder')}
                />
                <span className="doc-chat-threads-label">{t('globalChat.threads')}</span>
              </div>
              {loadingThreads ? (
                <p className="muted doc-chat-threads-loading" role="status">
                  <Spinner size="sm" label={t('common.loading')} />
                  <span>{t('common.loading')}</span>
                </p>
              ) : null}
              <div
                ref={threadListScrollRef}
                className="doc-chat-thread-list-scroll"
                data-testid={useThreadVirtual ? 'global-chat-thread-virtual-scroll' : undefined}
              >
                {useThreadVirtual ? (
                  <ul
                    className="doc-chat-thread-list doc-chat-thread-list-virtual"
                    style={{
                      height: `${String(threadVirtualizer.getTotalSize())}px`,
                      position: 'relative',
                    }}
                  >
                    {threadVirtualizer.getVirtualItems().map((virtualRow) => {
                      const thread = filteredThreads[virtualRow.index];
                      const selected = thread.id === activeThreadId;
                      const threadBusy = showThreadListSpinner(
                        thread,
                        activeThreadId,
                        generationInProgress
                      );
                      return (
                        <li
                          key={thread.id}
                          data-index={virtualRow.index}
                          ref={threadVirtualizer.measureElement}
                          className="doc-chat-thread-virtual-row"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${String(virtualRow.start)}px)`,
                          }}
                        >
                          <GlobalChatThreadRow
                            thread={thread}
                            selected={selected}
                            busy={threadBusy}
                            meta={formatThreadMeta(thread, dateLocale)}
                            onSelect={() => {
                              setActiveThreadId(thread.id);
                              if (stacked) closeThreads();
                            }}
                            onRename={(title) => onRenameThread(thread.id, title)}
                            onDelete={() => onDeleteThread(thread.id)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="doc-chat-thread-list">
                    {filteredThreads.map((thread) => {
                      const selected = thread.id === activeThreadId;
                      const threadBusy = showThreadListSpinner(
                        thread,
                        activeThreadId,
                        generationInProgress
                      );
                      return (
                        <GlobalChatThreadRow
                          key={thread.id}
                          thread={thread}
                          selected={selected}
                          busy={threadBusy}
                          meta={formatThreadMeta(thread, dateLocale)}
                          onSelect={() => {
                            setActiveThreadId(thread.id);
                            if (stacked) closeThreads();
                          }}
                          onRename={(title) => onRenameThread(thread.id, title)}
                          onDelete={() => onDeleteThread(thread.id)}
                        />
                      );
                    })}
                  </ul>
                )}
              </div>
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

                {showChatNotReady ? (
                  <GlobalChatNotReadyPanel
                    settings={userSettings}
                    onRetryStatus={reloadSettings}
                    onOpenChatMode={() => {
                      navigate(`${routes.settings}#settings-document-chat`);
                    }}
                  />
                ) : null}

                {!showChatNotReady && showPanePickThread ? (
                  <div className="doc-chat-empty-state doc-chat-empty-state-bootstrap">
                    <p className="muted doc-chat-empty-lead">{t('globalChat.pickThreadLead')}</p>
                  </div>
                ) : null}

                {!showChatNotReady && (showBootstrapEmpty || showComposerDraft) ? (
                  <GlobalChatEmptyState
                    chips={suggestionChips}
                    recentQuestions={recentQuestions}
                    loadingSuggestions={loadingSuggestions}
                    onPickQuestion={(text) => { setInput(text); }}
                  />
                ) : null}

                {showThreadEmpty ? (
                  <div className="doc-chat-empty-state doc-chat-empty-state-thread">
                    <p className="muted doc-chat-empty-lead">
                      {t('documents.documentChat.threadEmptyLead')}
                    </p>
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
                          onRetry={(messageId) => {
                            void (async () => {
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
                            })();
                          }}
                          onCancel={(messageId) => {
                            void (async () => {
                              if (!activeThreadId) return;
                              await cancelLibraryChatMessage(activeThreadId, messageId);
                            })();
                          }}
                          retryBusy={retryBusy}
                          renderCitationLink={(citation) => (
                            <Link
                              key={citation.ordinal}
                              to={routes.document(citation.documentId)}
                              state={{
                                highlightBlocks: citation.blocks,
                                citationPage: citation.page,
                              }}
                              className="doc-chat-citation-chip"
                            >
                              [{citation.ordinal}]
                            </Link>
                          )}
                        />
                      ) : (
                        <li key={message.id} className="doc-chat-bubble doc-chat-user">
                          <span className="doc-chat-role">
                            {t('documents.documentChat.roleUser')}
                          </span>
                          <p>{message.content}</p>
                        </li>
                      )
                    )}
                  </ul>
                ) : null}

                <div ref={logEndRef} className="doc-chat-log-anchor" aria-hidden="true" />
              </div>

              <form
                className={`doc-chat-composer${showChatNotReady ? ' doc-chat-composer-disabled' : ''}`}
                onSubmit={(e) => void onSubmit(e)}
              >
                <Input
                  value={input}
                  onChange={(e) => { setInput(e.target.value); }}
                  placeholder={
                    showChatNotReady ? t('globalChat.composerNotReadyPlaceholder') : t('globalChat.placeholder')
                  }
                  disabled={!composerEnabled}
                  aria-label={t('globalChat.placeholder')}
                />
                <Button
                  type="submit"
                  variant={showChatNotReady ? 'secondary' : 'primary'}
                  className="doc-chat-submit"
                  disabled={!composerEnabled || !input.trim()}
                  aria-busy={generationInProgress}
                >
                  {generationInProgress ? (
                    <>
                      <Spinner
                        size="sm"
                        tone="onPrimary"
                        label={t('documents.documentChat.sending')}
                      />
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
