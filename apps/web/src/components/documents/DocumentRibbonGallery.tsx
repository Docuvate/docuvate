// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useAppRibbonGallerySlot } from '../layout/appRibbonContext';

interface DocumentRibbonGalleryProps {
  /** Which gallery surface is open; null hides the band. */
  kind: 'fields' | 'labels' | null;
  children: ReactNode;
}

/**
 * Word-style in-ribbon gallery under the tool band. Felder / Labels content lives here —
 * never in a floating right inspector.
 */
export function DocumentRibbonGallery({ kind, children }: DocumentRibbonGalleryProps) {
  const slot = useAppRibbonGallerySlot();
  const { t } = useTranslation();
  if (!slot || kind === null) return null;

  const label =
    kind === 'fields' ? t('pipeline.workbench.title') : t('pipeline.aspects.name.labels');

  return createPortal(
    <div
      className="document-ribbon-gallery"
      data-testid="document-ribbon-gallery"
      data-gallery={kind}
      role="region"
      aria-label={label}
    >
      {children}
    </div>,
    slot
  );
}
