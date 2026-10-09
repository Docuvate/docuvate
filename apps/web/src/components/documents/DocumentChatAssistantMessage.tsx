import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessageCitationDto, DocumentChatMessageRecordDto } from '@docuvate/contracts';
import { formatChatGenerationError, toUserFacingChatGenerationError } from '../../lib/apiErrors';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface DocumentChatAssistantMessageProps {
  message: DocumentChatMessageRecordDto;
  onRetry: (messageId: string) => void;
  onCancel: (messageId: string) => void;
  retryBusy: boolean;
  renderCitationLink?: (citation: ChatMessageCitationDto) => React.ReactNode;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function DocumentChatAssistantMessage({
  message,
  onRetry,
  onCancel,
  retryBusy,
  renderCitationLink,
}: DocumentChatAssistantMessageProps) {
  const { t } = useTranslation();
  const status = message.generationStatus ?? 'done';
  const [elapsed, setElapsed] = useState(0);

  const isActive = status === 'pending' || status === 'streaming';
  const isFailed = status === 'failed';

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }
    const started = Date.parse(message.createdAt);
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, message.createdAt]);

  let statusLine: string | null = null;
  if (isActive) {
    if (message.generationPhase === 'retrieving' || status === 'pending') {
      statusLine = t('documents.documentChat.phaseRetrieving');
    } else if (message.generationPhase === 'verifying') {
      statusLine = t('documents.documentChat.phaseVerifying');
    } else {
      statusLine = t('documents.documentChat.phaseGenerating');
    }
  }

  const generationError = toUserFacingChatGenerationError(message.errorCode);

  return (
    <li
      className={`doc-chat-bubble doc-chat-assistant${isFailed ? ' doc-chat-assistant-failed' : ''}${isActive ? ' doc-chat-assistant-pending' : ''}`}
    >
      <span className="doc-chat-role">{t('documents.documentChat.roleAssistant')}</span>

      {isActive ? (
        <div className="doc-chat-status-block" role="status" aria-live="polite">
          <div className="doc-chat-typing-body">
            <Spinner size="sm" label={statusLine ?? t('documents.documentChat.typing')} />
            <span className="doc-chat-typing-text">{statusLine ?? t('documents.documentChat.typing')}</span>
          </div>
          <span className="muted doc-chat-elapsed">{formatElapsed(elapsed)}</span>
          <Button
            type="button"
            variant="secondary"
            className="doc-chat-cancel-btn"
            onClick={() => onCancel(message.id)}
          >
            {t('documents.documentChat.cancel')}
          </Button>
        </div>
      ) : null}

      {message.content ? <p className="doc-chat-assistant-content">{message.content}</p> : null}

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
                  {citation.page != null ? `, S. ${citation.page}` : ''}
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
              onClick={() => onRetry(message.id)}
            >
              {t('documents.documentChat.retry')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
