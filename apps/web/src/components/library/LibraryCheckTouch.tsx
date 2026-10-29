// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InputHTMLAttributes } from 'react';

export function LibraryCheckTouch({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`library-check-touch${className ? ` ${className}` : ''}`.trim()}>
      <input type="checkbox" {...props} />
    </label>
  );
}
