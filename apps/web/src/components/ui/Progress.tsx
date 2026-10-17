// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ProgressTone = 'accent' | 'ok' | 'danger';

export interface ProgressProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  className?: string;
  /** Accessible label for the bar. */
  label?: string;
}

export function Progress({ value, max = 100, tone = 'accent', className = '', label }: ProgressProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  const toneClass = tone === 'ok' ? 'progress-ok' : tone === 'danger' ? 'progress-danger' : '';
  return (
    <div
      className={`progress ${toneClass}${className ? ` ${className}` : ''}`.trim()}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <div className="progress-fill" style={{ width: `${String(percent)}%` }} />
    </div>
  );
}
