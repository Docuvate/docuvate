// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
interface SkeletonProps {
  className?: string;
  /** When true, skeleton is purely decorative (aria-hidden). */
  decorative?: boolean;
  /** Optional accessible label when skeleton conveys loading state alone. */
  label?: string;
}

export function Skeleton({ className = '', decorative = true, label }: SkeletonProps) {
  const ariaProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'status' as const, 'aria-label': label ?? 'Loading' };

  return <span className={`skeleton ${className}`.trim()} {...ariaProps} />;
}
