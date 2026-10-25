// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface ReconnectCountdownBarProps {
  secondsLeft: number;
  totalSeconds: number;
  label: string;
  probingLabel?: string;
  isProbing?: boolean;
}

export function ReconnectCountdownBar({
  secondsLeft,
  totalSeconds,
  label,
  probingLabel,
  isProbing = false,
}: ReconnectCountdownBarProps) {
  const safeTotal = Math.max(1, totalSeconds);
  const elapsed = Math.max(0, safeTotal - secondsLeft);
  const ratio = isProbing ? 1 : Math.min(1, elapsed / safeTotal);
  const percent = Math.round(ratio * 100);

  return (
    <div className="error-scene-countdown" aria-live="polite">
      <div
        className="error-scene-countdown-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={isProbing && probingLabel ? probingLabel : label}
      >
        <div className="error-scene-countdown-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="error-scene-countdown-label">
        {isProbing && probingLabel ? probingLabel : label}
      </p>
    </div>
  );
}
