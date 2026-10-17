// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  initials: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ initials, size = 'md', className = '' }: AvatarProps) {
  return (
    <span
      className={`avatar avatar-round avatar-${size}${className ? ` ${className}` : ''}`.trim()}
      aria-hidden
    >
      {initials}
    </span>
  );
}
