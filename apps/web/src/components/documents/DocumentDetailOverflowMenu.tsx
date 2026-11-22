// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { documentContentUrl } from '../../lib/api';
import { ribbonActionClass } from '../../lib/ribbonAction';
import { useDocumentFieldExport } from '../pipeline';
import { Menu, MenuContent, MenuTrigger } from '../ui/overlay/Menu';

interface DocumentDetailOverflowMenuProps {
  doc: DocumentDto;
  onDelete: () => void;
  onRequeueExtraction?: () => void;
  requeueBusy?: boolean;
  showTechnicalDetails?: boolean;
  onShowTechnicalDetailsChange?: (open: boolean) => void;
  /** Ribbon row uses compact ribbon-action styling. */
  variant?: 'page' | 'ribbon';
}

export function DocumentDetailOverflowMenu({
  doc,
  onDelete,
  onRequeueExtraction,
  requeueBusy = false,
  showTechnicalDetails = false,
  onShowTechnicalDetailsChange,
  variant = 'page',
}: DocumentDetailOverflowMenuProps) {
  const { t } = useTranslation();
  const fieldExport = useDocumentFieldExport(doc.id);
  const triggerClass =
    variant === 'ribbon'
      ? ribbonActionClass('tertiary', { menu: true, className: 'document-detail-overflow-trigger' })
      : 'document-detail-overflow-trigger btn btn-ghost';

  return (
    <Menu>
      <MenuTrigger className={triggerClass} aria-label={t('documents.moreActionsAria')}>
        <MoreHorizontal size={variant === 'ribbon' ? 16 : 18} strokeWidth={2} aria-hidden />
      </MenuTrigger>
      <MenuContent className="document-detail-overflow-panel popover-surface" align="end">
        <a
          className="document-detail-overflow-item"
          role="menuitem"
          href={documentContentUrl(doc.id, true)}
          download={doc.filename}
        >
          {t('documents.downloadOriginal')}
        </a>
        {doc.status === 'ready' ? (
          <>
            <button
              type="button"
              className="document-detail-overflow-item"
              role="menuitem"
              disabled={fieldExport.busy}
              onClick={() => void fieldExport.exportAs('csv')}
            >
              {t('pipeline.viewer.export.csv')}
            </button>
            <button
              type="button"
              className="document-detail-overflow-item"
              role="menuitem"
              disabled={fieldExport.busy}
              onClick={() => void fieldExport.exportAs('json')}
            >
              {t('pipeline.viewer.export.json')}
            </button>
            <hr className="document-detail-overflow-divider" />
          </>
        ) : null}
        {onRequeueExtraction ? (
          <button
            type="button"
            className="document-detail-overflow-item"
            role="menuitem"
            disabled={requeueBusy}
            onClick={onRequeueExtraction}
          >
            {t('documents.reprocess')}
          </button>
        ) : null}
        {onShowTechnicalDetailsChange ? (
          <button
            type="button"
            className="document-detail-overflow-item"
            role="menuitemcheckbox"
            aria-checked={showTechnicalDetails}
            onClick={() => {
              onShowTechnicalDetailsChange(!showTechnicalDetails);
            }}
          >
            {showTechnicalDetails
              ? t('documents.technicalDetailsHide')
              : t('documents.technicalDetailsShow')}
          </button>
        ) : null}
        <button
          type="button"
          className="document-detail-overflow-item document-detail-overflow-item-danger"
          role="menuitem"
          onClick={onDelete}
        >
          {t('common.delete')}
        </button>
      </MenuContent>
    </Menu>
  );
}