// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Eye, FileText, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

export type SourceChipKind = 'document' | 'page';

const KIND_ICON: Record<SourceChipKind, LucideIcon> = {
  document: FileText,
  page: Eye,
};

export interface SourceChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: SourceChipKind;
  label: string;
}

export function SourceChip({ kind = 'document', label, className = '', type = 'button', ...props }: SourceChipProps) {
  const Icon = KIND_ICON[kind];
  return (
    <button type={type} className={`source-chip${className ? ` ${className}` : ''}`.trim()} title={label} {...props}>
      <Icon size={13} strokeWidth={2} aria-hidden />
      <span className="source-chip-label">{label}</span>
    </button>
  );
}
