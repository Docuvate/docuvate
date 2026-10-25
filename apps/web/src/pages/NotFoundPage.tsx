// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DocuvateErrorPage } from '../components/errors/DocuvateErrorPage';
import { FullPageErrorShell } from '../components/errors/FullPageErrorShell';

export interface NotFoundPageProps {
  /** When true, render only the error card (inside AppShell). */
  embedded?: boolean;
}

export function NotFoundPage({ embedded = false }: NotFoundPageProps) {
  const content = <DocuvateErrorPage variant="not-found" />;
  if (embedded) {
    return (
      <FullPageErrorShell embedded testId="not-found-page">
        {content}
      </FullPageErrorShell>
    );
  }
  return (
    <FullPageErrorShell testId="not-found-page">
      {content}
    </FullPageErrorShell>
  );
}
