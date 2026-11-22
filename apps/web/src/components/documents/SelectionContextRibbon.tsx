// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { RibbonGroup } from '../layout/AppRibbon';
import { useAppRibbonContextSlot } from '../layout/appRibbonContext';
import type { ComboboxOption } from '../ui/Combobox';
import { DocumentFieldContextBar } from './DocumentFieldContextBar';
import type { DocumentSelectionDraft } from './DocumentSelectionLayer';

interface SelectionContextRibbonProps {
  draft: DocumentSelectionDraft;
  fieldOptions: ComboboxOption[];
  existingFieldValues: ReadonlyMap<string, string>;
  onConfirm: (fieldKey: string) => void;
  onMarkTable?: () => void;
  onCancel: () => void;
}

/**
 * Selection assign UI in the context ribbon row (desktop). Reuses field context bar logic.
 */
export function SelectionContextRibbon({
  draft,
  fieldOptions,
  existingFieldValues,
  onConfirm,
  onMarkTable,
  onCancel,
}: SelectionContextRibbonProps) {
  const slot = useAppRibbonContextSlot();
  const { t } = useTranslation();
  if (!slot) {
    return null;
  }

  return createPortal(
    <RibbonGroup label={t('ribbon.selection')} kind="act" showCaption>
      <DocumentFieldContextBar
        className="document-field-context-bar--ribbon"
        draft={draft}
        fieldOptions={fieldOptions}
        existingFieldValues={existingFieldValues}
        onConfirm={onConfirm}
        onMarkTable={onMarkTable}
        onCancel={onCancel}
      />
    </RibbonGroup>,
    slot
  );
}