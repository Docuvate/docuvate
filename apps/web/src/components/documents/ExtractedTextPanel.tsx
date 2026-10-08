import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExtractionBlock } from '@docuvate/contracts';
import { findBlockIndex, groupBlocksIntoLines, textFromExtractionBlocks } from '../../lib/extractionLayout';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ExtractedMarkdownPreview } from './ExtractedMarkdownPreview';

type ContentMode = 'text' | 'markdown';
type MarkdownView = 'preview' | 'source';

interface ExtractedTextPanelProps {
  fullText: string;
  markdown?: string | null;
  blocks: ExtractionBlock[];
  activePage: number;
  activeBlockIndex: number | null;
  pageSynced: boolean;
  onActivePageChange: (page: number) => void;
  onHighlightBlocks: (blocks: ExtractionBlock[]) => void;
  onBlocksChange: (blocks: ExtractionBlock[]) => void;
  onActiveBlockIndexChange: (index: number | null) => void;
  editMode?: boolean;
  allowCopy?: boolean;
}

export function ExtractedTextPanel({
  fullText,
  markdown,
  blocks,
  activePage,
  activeBlockIndex,
  pageSynced,
  onActivePageChange,
  onHighlightBlocks,
  onBlocksChange,
  onActiveBlockIndexChange,
  editMode = false,
  allowCopy = true,
}: ExtractedTextPanelProps) {
  const { t } = useTranslation();
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [contentMode, setContentMode] = useState<ContentMode>('text');
  const [markdownView, setMarkdownView] = useState<MarkdownView>('preview');
  const bodyRef = useRef<HTMLDivElement>(null);

  const markdownSource = markdown?.trim() ?? '';
  const hasMarkdown = markdownSource.length > 0;
  const showModeToggle = hasMarkdown && !editMode;
  const showMarkdownPane = showModeToggle && contentMode === 'markdown';

  const pageNumbers = [...new Set(blocks.map((b) => b.page))].sort((a, b) => a - b);

  const displayPages =
    pageSynced && pageNumbers.length > 1
      ? pageNumbers.includes(activePage)
        ? [activePage]
        : pageNumbers
      : pageNumbers;

  useEffect(() => {
    if (activeBlockIndex == null || editingBlockIndex != null) return;
    const host = bodyRef.current;
    if (!host) return;
    const el = host.querySelector<HTMLElement>(`[data-block-index="${activeBlockIndex}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeBlockIndex, editingBlockIndex]);

  const copyText = useCallback(
    async (text: string, hint: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopyHint(hint);
        window.setTimeout(() => setCopyHint(null), 2000);
      } catch {
        setCopyHint(t('documents.extractedTextCopyFailed'));
      }
    },
    [t]
  );

  const onCopy = useCallback(() => {
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      void copyText(sel, t('documents.extractedTextSelectionCopied'));
      return;
    }
    const plain = fullText.trim() || textFromExtractionBlocks(blocks);
    const text = showMarkdownPane ? markdownSource : plain;
    void copyText(text, t('documents.extractedTextCopied'));
  }, [blocks, copyText, fullText, markdownSource, showMarkdownPane, t]);

  function selectBlock(block: ExtractionBlock) {
    const index = findBlockIndex(blocks, block);
    if (index < 0) return;
    setEditingBlockIndex(null);
    onActiveBlockIndexChange(index);
    onActivePageChange(block.page);
    onHighlightBlocks([block]);
  }

  const copyableText = fullText.trim() || textFromExtractionBlocks(blocks).trim();
  const canCopy = copyableText.length > 0 || (hasMarkdown && markdownSource.length > 0);

  const crosslinkHint =
    pageSynced && pageNumbers.length > 1
      ? t('documents.extractedTextPageLink', { page: activePage })
      : t('documents.extractedTextLink');
  const pageHint = editMode
    ? `${crosslinkHint}${t('documents.extractedTextEditHint')}`
    : crosslinkHint;
  const hasDisplayContent =
    blocks.length > 0 || (fullText?.trim().length ?? 0) > 0;
  const showToolbar = allowCopy || hasDisplayContent;

  const showCopy = allowCopy && canCopy;

  const textPane =
    blocks.length > 0 ? (
      displayPages.map((page) => (
        <section
          key={page}
          className="extracted-text-page"
          data-page={page}
          aria-label={t('documents.extractedTextPageAria', { page })}
        >
          {pageNumbers.length > 1 && !pageSynced ? (
            <h3 className="extracted-text-page-title">
              {t('documents.extractedTextPageTitle', { page })}
            </h3>
          ) : null}
          {groupBlocksIntoLines(blocks, page).map((line) => {
            const lineKey = line.map((b) => `${b.x}-${b.y}-${b.text}`).join('|');
            return (
              <p key={lineKey} className="extracted-text-line">
                {line.map((block, wordIdx) => {
                  const index = findBlockIndex(blocks, block);
                  const isActive = activeBlockIndex === index;
                  const isEditing = editingBlockIndex === index;
                  return (
                    <span
                      key={`${block.page}-${block.blockIndex ?? index}-${block.x}-${block.text}`}
                      className="extracted-text-word-wrap"
                    >
                      {wordIdx > 0 ? ' ' : null}
                      {editMode && isEditing ? (
                        <Input
                          className="extracted-text-inline-edit"
                          value={block.text}
                          aria-label={t('documents.extractedTextEditBlockAria')}
                          autoFocus
                          onChange={(e) => {
                            if (index < 0) return;
                            const next = blocks.map((row, i) =>
                              i === index ? { ...row, text: e.target.value } : row
                            );
                            onBlocksChange(next);
                          }}
                          onBlur={() => {
                            setEditingBlockIndex(null);
                            onActiveBlockIndexChange(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              e.preventDefault();
                              setEditingBlockIndex(null);
                              onActiveBlockIndexChange(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          data-block-index={index}
                          className={`extracted-text-segment${isActive ? ' extracted-text-segment-active' : ''}`}
                          onClick={() => selectBlock(block)}
                          onDoubleClick={(e) => {
                            if (!editMode) return;
                            e.preventDefault();
                            if (index < 0) return;
                            setEditingBlockIndex(index);
                            onActiveBlockIndexChange(index);
                          }}
                        >
                          {block.text}
                        </span>
                      )}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </section>
      ))
    ) : fullText ? (
      <pre className="extraction-text extraction-text-flowing">{fullText}</pre>
    ) : (
      <p className="muted extraction-empty">{t('documents.extractionEmptyText')}</p>
    );

  return (
    <div className="extracted-text-panel">
      {showToolbar ? (
        <div className="extracted-text-toolbar">
          <span className="muted extracted-text-toolbar-label">
            {hasDisplayContent ? pageHint : null}
          </span>
          <div className="extracted-text-toolbar-actions">
            {showModeToggle ? (
              <>
                <div
                  className="extracted-text-view-toggle"
                  role="group"
                  aria-label={t('documents.extractedContentViewAria')}
                >
                  <Button
                    type="button"
                    variant={contentMode === 'text' ? 'secondary' : 'ghost'}
                    aria-pressed={contentMode === 'text'}
                    onClick={() => setContentMode('text')}
                  >
                    {t('documents.extractedContentModeText')}
                  </Button>
                  <Button
                    type="button"
                    variant={contentMode === 'markdown' ? 'secondary' : 'ghost'}
                    aria-pressed={contentMode === 'markdown'}
                    onClick={() => setContentMode('markdown')}
                  >
                    {t('documents.extractedContentModeMarkdown')}
                  </Button>
                </div>
                {contentMode === 'markdown' ? (
                  <div
                    className="extracted-text-view-toggle"
                    role="group"
                    aria-label={t('documents.extractedMarkdownViewAria')}
                  >
                    <Button
                      type="button"
                      variant={markdownView === 'preview' ? 'secondary' : 'ghost'}
                      aria-pressed={markdownView === 'preview'}
                      onClick={() => setMarkdownView('preview')}
                    >
                      {t('documents.extractedMarkdownPreview')}
                    </Button>
                    <Button
                      type="button"
                      variant={markdownView === 'source' ? 'secondary' : 'ghost'}
                      aria-pressed={markdownView === 'source'}
                      onClick={() => setMarkdownView('source')}
                    >
                      {t('documents.extractedMarkdownSource')}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
            {copyHint ? <span className="muted extracted-text-copy-hint">{copyHint}</span> : null}
            {showCopy ? (
              <Button type="button" variant="ghost" onClick={onCopy}>
                {t('documents.extractedTextCopy')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="extracted-text-body" ref={bodyRef}>
        {showMarkdownPane && markdownView === 'preview' ? (
          <ExtractedMarkdownPreview markdown={markdownSource} />
        ) : showMarkdownPane && markdownView === 'source' ? (
          <pre className="extraction-text extraction-text-flowing">{markdownSource}</pre>
        ) : (
          textPane
        )}
      </div>
    </div>
  );
}
