// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingsCardLinkProps {
  to: string;
  children: string;
}

export function SettingsCardLink({ to, children }: SettingsCardLinkProps) {
  return (
    <Link to={to} className="settings-card-link btn btn-secondary settings-card-link-btn">
      <span>{children}</span>
      <ChevronRight size={16} strokeWidth={2} aria-hidden />
    </Link>
  );
}
