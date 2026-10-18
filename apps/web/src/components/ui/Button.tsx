// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props },
  ref
) {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const spinnerTone = variant === 'primary' || variant === 'danger' ? 'onPrimary' : 'default';
  return (
    <button
      ref={ref}
      className={`btn btn-${variant} ${sizeClass} ${className}`.trim()}
      disabled={Boolean(disabled) || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" tone={spinnerTone} decorative /> : null}
      {children}
    </button>
  );
});
