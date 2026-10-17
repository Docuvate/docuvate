// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Info, Search, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';
import { SourceChip } from './SourceChip';

export type ChatMessageRole = 'user' | 'assistant' | 'abstain';

export interface ChatMessageProps {
  messageRole: ChatMessageRole;
  children: ReactNode;
  sources?: { kind?: 'document' | 'page'; label: string }[];
  abstainTitle?: string;
  onUpload?: () => void;
  onSearch?: () => void;
}

export function ChatMessage({
  messageRole,
  children,
  sources,
  abstainTitle,
  onUpload,
  onSearch,
}: ChatMessageProps) {
  const { t } = useTranslation();
  const resolvedAbstainTitle = abstainTitle ?? t('ui.chat.abstainTitle');
  if (messageRole === 'user') {
    return <div className="chat-message-user">{children}</div>;
  }

  if (messageRole === 'abstain') {
    return (
      <div className="chat-message-assistant chat-message-abstain">
        <p className="chat-message-abstain-head">
          <Info size={16} aria-hidden /> <strong>{resolvedAbstainTitle}</strong>
        </p>
        <div>{children}</div>
        <div className="ds-empty-state-actions">
          {onUpload ? (
            <Button type="button" size="sm" variant="secondary" onClick={onUpload}>
              <Upload size={16} aria-hidden /> {t('ui.chat.uploadDocument')}
            </Button>
          ) : null}
          {onSearch ? (
            <Button type="button" size="sm" variant="ghost" onClick={onSearch}>
              <Search size={16} aria-hidden /> {t('ui.chat.searchDocuments')}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message-assistant">
      <div>{children}</div>
      {sources && sources.length > 0 ? (
        <div className="chat-message-sources">
          <span className="chat-message-sources-label">{t('ui.chat.sources')}</span>
          {sources.map((source) => (
            <SourceChip key={source.label} kind={source.kind ?? 'page'} label={source.label} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
