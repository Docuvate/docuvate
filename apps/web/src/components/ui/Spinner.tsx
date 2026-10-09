// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
interface SpinnerProps {
  /** Accessible label; visually hidden when used decoratively inside labeled controls. */
  label?: string;
  size?: 'sm' | 'md';
  /** Light spinner for primary (ink indigo) buttons. */
  tone?: 'default' | 'onPrimary';
  className?: string;
}

export function Spinner({
  label = 'Lädt',
  size = 'md',
  tone = 'default',
  className = '',
}: SpinnerProps) {
  return (
    <span
      className={`spinner spinner-${size} spinner-${tone} ${className}`.trim()}
      role="status"
      aria-label={label}
    />
  );
}
