// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { fieldValueRowState } from '../../lib/documentFieldValueRowState';
import { formatExtractedFieldDisplayValue } from '../../lib/formatExtractedFieldDisplayValue';
import { FieldValueRow } from '../ui/FieldValueRow';

interface Props {
  fields: ExtractedField[];
  baselineFields: ExtractedField[];
  fieldLabel: (field: ExtractedField) => string;
  onConfirmField: (field: ExtractedField) => void;
  onCorrectField: (field: ExtractedField) => void;
}

export function DocumentFieldValueCards(props: Props) {
  const { fields, baselineFields, fieldLabel, onConfirmField, onCorrectField } = props;
  const { i18n } = useTranslation();

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="document-field-value-cards">
      {fields.map((field) => {
        const baseline = baselineFields.find((row) => row.key === field.key);
        const state = fieldValueRowState(field, baseline);
        const displayValue = formatExtractedFieldDisplayValue(
          field.key,
          field.value,
          i18n.language
        );
        return (
          <FieldValueRow
            key={field.key}
            fieldName={fieldLabel(field)}
            value={displayValue}
            state={state}
            confidencePercent={
              field.confidence != null ? Math.round(field.confidence * 100) : undefined
            }
            originalValue={
              state === 'corrected' && baseline
                ? formatExtractedFieldDisplayValue(
                    baseline.key,
                    baseline.value,
                    i18n.language
                  )
                : undefined
            }
            onConfirm={state === 'suggested' ? () => { onConfirmField(field); } : undefined}
            onCorrect={() => { onCorrectField(field); }}
          />
        );
      })}
    </div>
  );
}
