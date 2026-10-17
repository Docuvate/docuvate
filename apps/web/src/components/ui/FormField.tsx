// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import { useId } from 'react';

export interface FormFieldProps {
  label: string;
  help?: string;
  error?: string;
  showHelp?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  help,
  error,
  showHelp = true,
  htmlFor,
  children,
  className = '',
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;
  const hintText = error ?? (showHelp && help ? help : '');
  const hintVisible = hintText.length > 0;

  return (
    <div className={`form-field${error ? ' form-field-error' : ''}${className ? ` ${className}` : ''}`.trim()}>
      <label className="form-field-label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="form-field-control">{children}</div>
      <p className="form-field-hint" role={error ? 'alert' : undefined} aria-live={error ? 'polite' : undefined}>
        {hintVisible ? hintText : '\u00a0'}
      </p>
    </div>
  );
}
