// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock, LayoutIrDocument, LayoutIrPageSummary } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/Button';
import { ExtractedTextPanel } from './ExtractedTextPanel';

interface DocumentLayoutTextStageProps {
  documentId: string;
  fullText: string;
  layoutIrAvailable: boolean;
  layoutIrDocument: LayoutIrDocument | null;
  layoutIrPages: LayoutIrPageSummary[] | undefined;
  blocks: ExtractionBlock[];
  viewerPage: number;
  activeBlockIndex: number | null;
  editMode: boolean;
  onViewerPageChange: (page: number) => void;
  onHighlightBlocks: (blocks: ExtractionBlock[]) => void;
  onBlocksChange: (blocks: ExtractionBlock[]) => void;
  onActiveBlockIndexChange: (index: number | null) => void;
  documentTitle: string;
  blocksDirty: boolean;
  saving: boolean;
  onSaveBlocks: () => void;
}

export function DocumentLayoutTextStage({
  documentId,
  fullText,
  layoutIrAvailable,
  layoutIrDocument,
  layoutIrPages,
  blocks,
  viewerPage,
  activeBlockIndex,
  editMode,
  onViewerPageChange,
  onHighlightBlocks,
  onBlocksChange,
  onActiveBlockIndexChange,
  documentTitle,
  blocksDirty,
  saving,
  onSaveBlocks,
}: DocumentLayoutTextStageProps) {
  const { t } = useTranslation();

  return (
    <div className="layout-text-stage">
      <ExtractedTextPanel
        documentId={documentId}
        fullText={fullText}
        layoutIrAvailable={layoutIrAvailable}
        layoutIrDocument={layoutIrDocument}
        layoutIrPages={layoutIrPages}
        blocks={blocks}
        activePage={viewerPage}
        activeBlockIndex={activeBlockIndex}
        pageSynced
        editMode={editMode}
        allowCopy
        onActivePageChange={onViewerPageChange}
        onHighlightBlocks={onHighlightBlocks}
        onBlocksChange={onBlocksChange}
        onActiveBlockIndexChange={onActiveBlockIndexChange}
        documentTitle={documentTitle}
        textOnly
      />
      {blocksDirty ? (
        <div className="layout-text-edit-save">
          <Button type="button" variant="secondary" disabled={saving} onClick={onSaveBlocks}>
            {saving ? t('documents.saving') : t('documents.save')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}