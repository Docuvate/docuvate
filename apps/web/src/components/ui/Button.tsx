// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ButtonHTMLAttributes,forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', ...props },
  ref
) {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  return (
    <button ref={ref} className={`btn btn-${variant} ${sizeClass} ${className}`.trim()} {...props} />
  );
});
