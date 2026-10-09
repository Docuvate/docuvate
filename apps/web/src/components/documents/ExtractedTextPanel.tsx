import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExtractionBlock, LayoutIrPageSummary } from '@docuvate/contracts';
import { layoutIrDocumentFromPageSummaries } from '../../lib/layoutIrPages';
import {
  findBlockIndex,
  groupBlocksIntoLines,
  textFromExtractionBlocks,
} from '../../lib/extractionLayout';
import { fetchDocumentLayoutTypst } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ContextMenu, type ContextMenuEntry } from '../ui/ContextMenu';
import { useNarrowTopbar } from '../../lib/useNarrowTopbar';
import { useToastNotify } from '../save/ToastProvider';
import { ExtractedLayoutFallback } from './ExtractedLayoutFallback';
import {
  ExtractedLayoutHtmlFrame,
  LAYOUT_IR_ZOOM_STEPS,
  type LayoutIrZoomStep,
} from './ExtractedLayoutHtmlFrame';

type ContentMode = 'text' | 'layout';

const LAYOUT_IR_PLACEHOLDER = layoutIrDocumentFromPageSummaries([
  { page: 1, widthPt: 595, heightPt: 842 },
]);

interface ExtractedTextPanelProps {
  documentId?: string;
  fullText: string;
  markdown?: string | null;
  layoutIrAvailable?: boolean;
  layoutIrPages?: LayoutIrPageSummary[];
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
  requeueBusy?: boolean;
  onRequeueExtraction?: () => void;
  documentTitle?: string;
}

export function ExtractedTextPanel({
  documentId,
  fullText,
  markdown,
  layoutIrAvailable = false,
  layoutIrPages,
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
  requeueBusy = false,
  onRequeueExtraction,
  documentTitle,
}: ExtractedTextPanelProps) {
  const { t } = useTranslation();
  const { pushError } = useToastNotify();
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [contentMode, setContentMode] = useState<ContentMode>('text');
  const [layoutZoom, setLayoutZoom] = useState<LayoutIrZoomStep>(100);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportMenuPos, setExportMenuPos] = useState({ x: 0, y: 0 });
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const narrowViewport = useNarrowTopbar();

  const markdownSource = markdown?.trim() ?? '';
  const hasLayoutIr = (layoutIrPages?.length ?? 0) > 0;
  const layoutIrPending = layoutIrAvailable && !hasLayoutIr;
  const showModeToggle = !editMode && (blocks.length > 0 || (fullText?.trim().length ?? 0) > 0);
  const showLayoutPane = showModeToggle && contentMode === 'layout';

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
    let el = host.querySelector<HTMLElement>(`[data-block-index="${activeBlockIndex}"]`);
    if (!el && contentMode === 'layout') {
      const iframe = host.querySelector<HTMLIFrameElement>('.layout-ir-html-frame');
      el =
        iframe?.contentDocument?.querySelector<HTMLElement>(
          `[data-block-index="${activeBlockIndex}"]`
        ) ?? null;
    }
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeBlockIndex, editingBlockIndex, contentMode]);

  useEffect(() => {
    if (narrowViewport && hasLayoutIr) {
      setContentMode('text');
    }
  }, [hasLayoutIr, narrowViewport]);

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

  const onCopyPlain = useCallback(() => {
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      void copyText(sel, t('documents.extractedTextSelectionCopied'));
      return;
    }
    const plain = fullText.trim() || textFromExtractionBlocks(blocks);
    void copyText(plain, t('documents.extractedTextCopied'));
    setExportMenuOpen(false);
  }, [blocks, copyText, fullText, t]);

  const onCopyMarkdown = useCallback(() => {
    if (!markdownSource) return;
    void copyText(markdownSource, t('documents.extractedMarkdownCopied'));
    setExportMenuOpen(false);
  }, [copyText, markdownSource, t]);

  const downloadTypst = useCallback(async () => {
    if (!documentId) return;
    try {
      const { typst } = await fetchDocumentLayoutTypst(documentId);
      const blob = new Blob([typst], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (documentTitle ?? 'document').replace(/[^\wäöüÄÖÜß.-]+/g, '-').slice(0, 80);
      a.download = `${safeTitle}-layout.typ`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setExportMenuOpen(false);
    } catch {
      pushError(t('documents.layoutExportTypstFailed'));
    }
  }, [documentId, documentTitle, pushError, t]);

  const exportMenuItems = useMemo((): ContextMenuEntry[] => {
    const items: ContextMenuEntry[] = [];
    if (hasLayoutIr) {
      items.push({
        kind: 'item',
        id: 'export-typst',
        label: t('documents.layoutExportTypst'),
        onSelect: () => {
          void downloadTypst();
        },
      });
    }
    const copyableText = fullText.trim() || textFromExtractionBlocks(blocks).trim();
    const canCopy = allowCopy && (copyableText.length > 0 || markdownSource.length > 0);
    if (canCopy) {
      items.push({
        kind: 'item',
        id: 'copy-plain',
        label: t('documents.extractedTextCopyPlain'),
        onSelect: onCopyPlain,
      });
    }
    if (markdownSource) {
      items.push({
        kind: 'item',
        id: 'copy-markdown',
        label: t('documents.extractedCopyAsMarkdown'),
        onSelect: onCopyMarkdown,
      });
    }
    return items;
  }, [
    allowCopy,
    blocks,
    downloadTypst,
    fullText,
    hasLayoutIr,
    markdownSource,
    onCopyMarkdown,
    onCopyPlain,
    t,
  ]);

  function selectBlock(block: ExtractionBlock) {
    const index = findBlockIndex(blocks, block);
    if (index < 0) return;
    setEditingBlockIndex(null);
    onActiveBlockIndexChange(index);
    onActivePageChange(block.page);
    onHighlightBlocks([block]);
  }

  const copyableText = fullText.trim() || textFromExtractionBlocks(blocks).trim();
  const canCopy = copyableText.length > 0 || markdownSource.length > 0;

  const layoutPageCount = layoutIrPages?.length ?? pageNumbers.length;
  const crosslinkHint =
    pageSynced && layoutPageCount > 1
      ? t('documents.extractedTextPageLink', {
          page: activePage,
          total: layoutPageCount,
        })
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

  const frameLayoutIr =
    layoutIrPages && layoutIrPages.length > 0
      ? layoutIrDocumentFromPageSummaries(layoutIrPages)
      : LAYOUT_IR_PLACEHOLDER;
  const canShowLayoutFrame = Boolean(documentId) && (layoutIrPending || hasLayoutIr);
  const layoutPane = canShowLayoutFrame ? (
    <ExtractedLayoutHtmlFrame
      documentId={documentId!}
      layoutIr={frameLayoutIr}
      activePage={activePage}
      pageSynced={pageSynced}
      pageCount={frameLayoutIr.pages.length}
      zoom={layoutZoom}
      requeueBusy={requeueBusy}
      onRequeueExtraction={onRequeueExtraction}
      suspendHtmlFetch={layoutIrPending}
    />
  ) : (
    <ExtractedLayoutFallback requeueBusy={requeueBusy} onRequeue={onRequeueExtraction} />
  );

  const openExportMenu = useCallback(() => {
    const trigger = exportTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setExportMenuPos({ x: rect.right, y: rect.bottom + 4 });
    setExportMenuOpen(true);
  }, []);

  return (
    <div className="extracted-text-panel">
      {showToolbar ? (
        <div className="extracted-text-toolbar">
          <div className="extracted-text-toolbar-primary">
            {showModeToggle ? (
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
                  variant={contentMode === 'layout' ? 'secondary' : 'ghost'}
                  aria-pressed={contentMode === 'layout'}
                  onClick={() => setContentMode('layout')}
                >
                  {t('documents.extractedContentModeLayout')}
                </Button>
              </div>
            ) : null}
            {hasDisplayContent ? (
              <span className="muted extracted-text-toolbar-label">{pageHint}</span>
            ) : null}
          </div>
          <div className="extracted-text-toolbar-actions">
            {copyHint ? <span className="muted extracted-text-copy-hint">{copyHint}</span> : null}
            {(hasLayoutIr || showCopy) && exportMenuItems.length > 0 ? (
              <div className="extracted-text-export-menu">
                <Button
                  ref={exportTriggerRef}
                  type="button"
                  variant="ghost"
                  aria-expanded={exportMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => (exportMenuOpen ? setExportMenuOpen(false) : openExportMenu())}
                >
                  {t('documents.layoutExportMenu')}
                </Button>
                <ContextMenu
                  open={exportMenuOpen}
                  x={exportMenuPos.x}
                  y={exportMenuPos.y}
                  items={exportMenuItems}
                  anchorRef={exportTriggerRef}
                  onClose={() => {
                    setExportMenuOpen(false);
                    exportTriggerRef.current?.focus();
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {showLayoutPane ? (
        <div className="layout-ir-zoom-toolbar" role="toolbar" aria-label={t('documents.layoutZoomAria')}>
          {LAYOUT_IR_ZOOM_STEPS.map((step) => (
            <Button
              key={step}
              type="button"
              variant={layoutZoom === step ? 'secondary' : 'ghost'}
              className="layout-ir-zoom-btn"
              aria-pressed={layoutZoom === step}
              onClick={() => setLayoutZoom(step)}
            >
              {t('documents.layoutZoomPercent', { value: step })}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="extracted-text-body" ref={bodyRef}>
        {showLayoutPane ? layoutPane : textPane}
      </div>
    </div>
  );
}
