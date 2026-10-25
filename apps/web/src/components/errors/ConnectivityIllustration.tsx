// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectivityFailureKind } from '../../lib/authConnectivity';

export interface ConnectivityIllustrationProps {
  kind: ConnectivityFailureKind | 'generic';
  className?: string;
}

export function ConnectivityIllustration({ kind, className = '' }: ConnectivityIllustrationProps) {
  const variantClass =
    kind === 'browser-offline'
      ? 'ds-connectivity-illustration--offline'
      : kind === 'server-error'
        ? 'ds-connectivity-illustration--server-error'
        : 'ds-connectivity-illustration--unreachable';

  return (
    <svg
      className={`ds-connectivity-illustration ${variantClass}${className ? ` ${className}` : ''}`.trim()}
      viewBox="0 0 120 80"
      role="img"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className="ds-connectivity-illustration-bg" x="8" y="12" width="104" height="56" rx="12" />
      <circle className="ds-connectivity-illustration-node" cx="32" cy="40" r="10" />
      <circle className="ds-connectivity-illustration-node" cx="88" cy="40" r="10" />
      <path className="ds-connectivity-illustration-link" d="M42 40 H58" />
      <path className="ds-connectivity-illustration-link ds-connectivity-illustration-link--tail" d="M62 40 H78" />
      {kind === 'browser-offline' ? (
        <path className="ds-connectivity-illustration-break" d="M58 34 L62 46" />
      ) : (
        <path className="ds-connectivity-illustration-break" d="M58 32 L62 48 M62 32 L58 48" />
      )}
      <circle className="ds-connectivity-illustration-pulse" cx="60" cy="40" r="4" />
    </svg>
  );
}
