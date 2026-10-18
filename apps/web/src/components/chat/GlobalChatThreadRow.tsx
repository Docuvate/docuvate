// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentChatThreadDto } from '@docuvate/contracts';
import { Ellipsis } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';

interface GlobalChatThreadRowProps {
  thread: DocumentChatThreadDto;
  selected: boolean;
  busy: boolean;
  meta: string;
  onSelect: () => void;
  onRename: (nextTitle: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function GlobalChatThreadRow({
  thread,
  selected,
  busy,
  meta,
  onSelect,
  onRename,
  onDelete,
}: GlobalChatThreadRowProps) {
  const { t } = useTranslation();
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(thread.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPoint, setMenuPoint] = useState({ x: 0, y: 0 });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowHover, setRowHover] = useState(false);
  const [rowFocusWithin, setRowFocusWithin] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (renaming) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!renaming) {
      setRenameDraft(thread.title);
    }
  }, [renaming, thread.title]);

  const showMenuTrigger = selected || rowHover || rowFocusWithin || menuOpen;

  const menuItems: ContextMenuEntry[] = [
    {
      kind: 'item',
      id: 'rename',
      label: t('globalChat.renameThread'),
      onSelect: () => {
        setRenaming(true);
        setRenameDraft(thread.title);
      },
    },
    {
      kind: 'item',
      id: 'delete',
      label: t('globalChat.deleteThread'),
      danger: true,
      onSelect: () => {
        setDeleteOpen(true);
      },
    },
  ];

  async function submitRename(event: FormEvent) {
    event.preventDefault();
    const trimmed = renameDraft.trim();
    if (!trimmed || trimmed === thread.title) {
      setRenaming(false);
      return;
    }
    await onRename(trimmed);
    setRenaming(false);
  }

  return (
    <li
      className="doc-chat-thread-row"
      onMouseEnter={() => { setRowHover(true); }}
      onMouseLeave={() => { setRowHover(false); }}
      onFocusCapture={() => { setRowFocusWithin(true); }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setRowFocusWithin(false);
        }
      }}
    >
      {renaming ? (
        <form className="doc-chat-thread-rename-inline" onSubmit={(e) => void submitRename(e)}>
          <Input
            ref={renameInputRef}
            className="doc-chat-thread-rename-input"
            value={renameDraft}
            onChange={(e) => { setRenameDraft(e.target.value); }}
            aria-label={t('globalChat.renameThreadAria')}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setRenaming(false);
                setRenameDraft(thread.title);
              }
            }}
          />
        </form>
      ) : (
        <>
          <button
            type="button"
            className={`doc-chat-thread-item${selected ? ' active' : ''}`}
            aria-current={selected ? 'true' : undefined}
            onClick={onSelect}
          >
            <span className="doc-chat-thread-title-row">
              <span className="doc-chat-thread-title">{thread.title}</span>
              {busy ? (
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
            <span className="doc-chat-thread-meta">{meta}</span>
          </button>
          <div
            className={`doc-chat-thread-menu-slot${showMenuTrigger ? ' doc-chat-thread-menu-slot-visible' : ''}`}
          >
            <IconButton
              ref={menuAnchorRef}
              icon={Ellipsis}
              label={t('globalChat.threadMenuAria')}
              size="sm"
              hasPopup="menu"
              aria-expanded={menuOpen}
              onClick={(event) => {
                setMenuPoint({ x: event.clientX, y: event.clientY });
                setMenuOpen(true);
              }}
            />
          </div>
        </>
      )}
      <ContextMenu
        open={menuOpen}
        x={menuPoint.x}
        y={menuPoint.y}
        items={menuItems}
        anchorRef={menuAnchorRef}
        onClose={() => { setMenuOpen(false); }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={t('globalChat.deleteThreadConfirmTitle')}
        description={t('globalChat.deleteThreadConfirmBody', { title: thread.title })}
        confirmLabel={t('globalChat.deleteThread')}
        tone="danger"
        onCancel={() => { setDeleteOpen(false); }}
        onConfirm={() => {
          setDeleteOpen(false);
          void onDelete();
        }}
      />
    </li>
  );
}
