// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Radio({ label, className = '', id, ...props }: RadioProps) {
  return (
    <label className={`radio-field${className ? ` ${className}` : ''}`.trim()} htmlFor={id}>
      <input {...props} id={id} type="radio" className="radio-input" />
      <span className="radio-dot" aria-hidden />
      <span>{label}</span>
    </label>
  );
}
