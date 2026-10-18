// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GlobalChatSuggestionChip } from '../../lib/globalChatSuggestions';
import { Button } from '../ui/Button';

interface GlobalChatEmptyStateProps {
  chips: GlobalChatSuggestionChip[];
  recentQuestions: string[];
  loadingSuggestions: boolean;
  onPickQuestion: (text: string) => void;
}

export function GlobalChatEmptyState({
  chips,
  recentQuestions,
  loadingSuggestions,
  onPickQuestion,
}: GlobalChatEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="doc-chat-empty-state doc-chat-empty-state-bootstrap global-chat-empty-state">
      <div className="global-chat-empty-icon" aria-hidden="true">
        <MessageSquare size={26} strokeWidth={1.75} />
      </div>
      <h2 className="doc-chat-empty-title">{t('globalChat.emptyPaneTitle')}</h2>
      <p className="muted doc-chat-empty-lead">{t('globalChat.bootstrapLead')}</p>
      {loadingSuggestions ? (
        <p className="muted global-chat-suggestions-loading">{t('common.loading')}</p>
      ) : null}
      {!loadingSuggestions && chips.length > 0 ? (
        <div className="global-chat-suggestion-chips" role="list">
          {chips.map((chip) => (
            <Button
              key={chip.id}
              type="button"
              variant="secondary"
              className="global-chat-suggestion-chip"
              role="listitem"
              onClick={() => { onPickQuestion(chip.text); }}
            >
              <Sparkles size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>{chip.text}</span>
            </Button>
          ))}
        </div>
      ) : null}
      {!loadingSuggestions && recentQuestions.length > 0 ? (
        <div className="global-chat-recent-questions">
          <p className="global-chat-recent-label">{t('globalChat.recentQuestionsTitle')}</p>
          <ul className="global-chat-recent-list">
            {recentQuestions.map((q) => (
              <li key={q}>
                <button type="button" className="global-chat-recent-item" onClick={() => { onPickQuestion(q); }}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="global-chat-suggestions-caption">{t('globalChat.suggestionsCaption')}</p>
    </div>
  );
}
