// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
type DocsPageHeaderProps = {
  title: string;
  lead: string;
};

export function DocsPageHeader({ title, lead }: DocsPageHeaderProps) {
  return (
    <header className="docs-page-header">
      <h1 className="docs-page-title">{title}</h1>
      <p className="docs-page-lead">{lead}</p>
    </header>
  );
}
