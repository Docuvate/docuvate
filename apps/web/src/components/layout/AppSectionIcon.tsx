// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FileText, Folder, LayoutDashboard, ListChecks, Settings, Tags } from 'lucide-react';

import type { AppSection } from '../../lib/appNav';

const ICONS = {
  home: LayoutDashboard,
  documents: FileText,
  labels: Tags,
  fields: ListChecks,
  folders: Folder,
  settings: Settings,
} as const;

export function AppSectionIcon({ section, size = 20 }: { section: AppSection; size?: number }) {
  const Icon = ICONS[section];
  return <Icon size={size} strokeWidth={1.75} />;
}
