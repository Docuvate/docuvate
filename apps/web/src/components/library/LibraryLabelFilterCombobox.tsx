// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FieldFilterValuePicker } from '../labels/FieldFilterValuePicker';

interface LibraryLabelFilterComboboxProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

export function LibraryLabelFilterCombobox(props: LibraryLabelFilterComboboxProps) {
  return (
    <FieldFilterValuePicker
      fieldKey={props.fieldKey}
      label={props.label}
      value={props.value}
      onChange={props.onChange}
      testId={props.testId}
    />
  );
}
