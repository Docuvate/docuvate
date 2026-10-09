// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LucideIcon } from 'lucide-react';

export function SegmentedIconLabel({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <span className="segmented-icon-label">
      <Icon className="segmented-icon-label__icon" aria-hidden size={20} strokeWidth={2} />
      <span className="segmented-icon-label__text">{label}</span>
    </span>
  );
}
