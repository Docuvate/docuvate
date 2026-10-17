// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type LogoType = 'full' | 'mark';

export interface LogoProps {
  type?: LogoType;
  className?: string;
}

export function Logo({ type = 'full', className = '' }: LogoProps) {
  return (
    <span className={`logo logo-${type}${className ? ` ${className}` : ''}`.trim()} aria-hidden={type === 'mark'}>
      <svg className="logo-mark" viewBox="4 2 40 42" fill="none" aria-hidden>
        <path
          d="M8 6 L22 8 L37 10"
          stroke="currentColor"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-stroke"
        />
        <path
          d="M8 21 L24 22 L38 24"
          stroke="currentColor"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 37 L26 38 L40 40"
          stroke="currentColor"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {type === 'full' ? <span className="logo-wordmark">Docuvate</span> : null}
    </span>
  );
}
