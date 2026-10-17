// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
interface SpinnerProps {
  /** Accessible label; omit when nested in a control with aria-busy. */
  label?: string;
  size?: 'sm' | 'md';
  /** Light spinner for primary (ink indigo) buttons. */
  tone?: 'default' | 'onPrimary';
  className?: string;
  /** Hide from accessibility tree when parent announces loading state. */
  decorative?: boolean;
}

export function Spinner({
  label = 'Lädt',
  size = 'md',
  tone = 'default',
  className = '',
  decorative = false,
}: SpinnerProps) {
  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'status' as const, 'aria-label': label };
  return (
    <span
      className={`spinner spinner-${size} spinner-${tone} ${className}`.trim()}
      {...ariaProps}
    />
  );
}
