// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ChatMessageCitationDto, DocumentChatMessageRecordDto } from '@docuvate/contracts';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatChatGenerationError, toUserFacingChatGenerationError } from '../../lib/apiErrors';
import { CHAT_GENERATION_MAX_WAIT_SEC } from '../../lib/chatGenerationLimits';
import { chatGenerationWaitStartMs } from '../../lib/chatGenerationWaitStart';
import {
  extractReadableCitedAnswerPreview,
  looksLikeCitedAnswerJson,
} from '../../lib/extractCitedStreamPreview';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface DocumentChatAssistantMessageProps {
  message: DocumentChatMessageRecordDto;
  onRetry: (messageId: string) => void;
  onCancel: (messageId: string) => void;
  retryBusy: boolean;
  /** Library/global chat uses broader retrieval copy. */
  chatScope?: 'document' | 'library';
  renderCitationLink?: (citation: ChatMessageCitationDto) => React.ReactNode;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${String(m)}:${String(s).padStart(2, '0')}` : `${String(s)}s`;
}

export function DocumentChatAssistantMessage({
  message,
  onRetry,
  onCancel,
  retryBusy,
  chatScope = 'document',
  renderCitationLink,
}: DocumentChatAssistantMessageProps) {
  const { t } = useTranslation();
  const status = message.generationStatus ?? 'done';
  const [elapsed, setElapsed] = useState(0);
  const timedOutRef = useRef(false);

  const isActive = status === 'pending' || status === 'streaming';
  const isFailed = status === 'failed';

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }
    const tick = () => {
      const started = chatGenerationWaitStartMs(message);
      if (started == null) {
        setElapsed(0);
        return;
      }
      setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => { clearInterval(id); };
  }, [
    isActive,
    message.createdAt,
    message.updatedAt,
    message.generationPhase,
    message.generationStatus,
  ]);

  useEffect(() => {
    timedOutRef.current = false;
  }, [message.id]);

  useEffect(() => {
    if (!isActive || chatGenerationWaitStartMs(message) == null) {
      return;
    }
    if (elapsed < CHAT_GENERATION_MAX_WAIT_SEC || timedOutRef.current) {
      return;
    }
    timedOutRef.current = true;
    onCancel(message.id);
  }, [elapsed, isActive, message, onCancel]);

  let statusLine: string | null = null;
  if (isActive) {
    if (message.generationPhase === 'retrieving' || status === 'pending') {
      statusLine =
        chatScope === 'library'
          ? t('documents.documentChat.phaseRetrievingLibrary')
          : t('documents.documentChat.phaseRetrieving');
    } else if (message.generationPhase === 'verifying') {
      statusLine = t('documents.documentChat.phaseVerifying');
    } else {
      statusLine = t('documents.documentChat.phaseGenerating');
    }
  }

  const generationError = toUserFacingChatGenerationError(message.errorCode);

  const displayContent =
    message.content && looksLikeCitedAnswerJson(message.content)
      ? extractReadableCitedAnswerPreview(message.content)
      : message.content;

  return (
    <li
      className={`doc-chat-bubble doc-chat-assistant${isFailed ? ' doc-chat-assistant-failed' : ''}${isActive ? ' doc-chat-assistant-pending' : ''}`}
    >
      <span className="doc-chat-role">{t('documents.documentChat.roleAssistant')}</span>

      {isActive ? (
        <div className="doc-chat-status-block" role="status" aria-live="polite">
          <div className="doc-chat-typing-body">
            <Spinner size="sm" label={statusLine ?? t('documents.documentChat.typing')} />
            <span className="doc-chat-typing-text">
              {statusLine ?? t('documents.documentChat.typing')}
            </span>
          </div>
          <span className="muted doc-chat-elapsed">{formatElapsed(elapsed)}</span>
          <Button
            type="button"
            variant="secondary"
            className="doc-chat-cancel-btn"
            onClick={() => { onCancel(message.id); }}
          >
            {t('documents.documentChat.cancel')}
          </Button>
        </div>
      ) : null}

      {displayContent ? <p className="doc-chat-assistant-content">{displayContent}</p> : null}

      {message.citations && message.citations.length > 0 ? (
        <div className="doc-chat-sources">
          <span className="doc-chat-sources-label">{t('documents.documentChat.sources')}</span>
          <ul className="doc-chat-sources-list">
            {message.citations.map((citation) => (
              <li key={citation.ordinal}>
                {renderCitationLink ? (
                  renderCitationLink(citation)
                ) : (
                  <span className="doc-chat-citation-chip">[{citation.ordinal}]</span>
                )}
                <span className="muted">
                  {citation.documentTitle}
                  {citation.page != null ? `, S. ${String(citation.page)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isFailed ? (
        <div className="doc-chat-error-block" role="alert">
          <p>{formatChatGenerationError(message.errorCode)}</p>
          {generationError.retryable ? (
            <Button
              type="button"
              variant="secondary"
              className="doc-chat-retry-btn"
              disabled={retryBusy}
              onClick={() => { onRetry(message.id); }}
            >
              {t('documents.documentChat.retry')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
