// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { type ConfidenceLevel,confidenceLevelFromPercent } from '../../lib/confidenceLevel';

export interface ConfidenceProps {
  /** 0–100 */
  value: number;
  className?: string;
}

function levelClass(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'confidence-high';
    case 'medium':
      return 'confidence-medium';
    case 'low':
      return 'confidence-low';
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function Confidence({ value, className = '' }: ConfidenceProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const level = confidenceLevelFromPercent(clamped);
  return (
    <span className={`confidence ${levelClass(level)}${className ? ` ${className}` : ''}`.trim()}>
      <span className="confidence-track" aria-hidden>
        <span className="confidence-fill" style={{ width: `${String(clamped)}%` }} />
      </span>
      <span className="confidence-value">{clamped} %</span>
    </span>
  );
}
