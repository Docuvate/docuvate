// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Page title (rendered as the page's single h1). */
  title: ReactNode;
  /** One-sentence lead in muted text below the title. */
  description?: ReactNode;
  /** Small context line above the title (e.g. breadcrumb). */
  eyebrow?: ReactNode;
  /** Primary / secondary page actions, right-aligned on wide screens. */
  actions?: ReactNode;
  /** Extra class names for page-specific layout hooks (kept for existing selectors). */
  className?: string;
  /** Class name of the title block (left column). */
  headingClassName?: string;
  titleId?: string;
  /** Keep `data-ux="page-title"` on the h1 (default) for UX metrics and tests. */
  markAsPageTitle?: boolean;
  /** Heading element; only previews / embedded docs should use h2. */
  titleAs?: 'h1' | 'h2';
}

/**
 * Page header pattern: one h1, optional lead and right-aligned actions.
 * Use exactly once per page, directly inside `.page`. See /docs/styles → Page header.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className = '',
  headingClassName = '',
  titleId,
  markAsPageTitle = true,
  titleAs: Title = 'h1',
}: PageHeaderProps) {
  return (
    <header className={`page-header ds-page-header${className ? ` ${className}` : ''}`}>
      <div className={`ds-page-header-heading${headingClassName ? ` ${headingClassName}` : ''}`}>
        {eyebrow ? <div className="ds-page-header-eyebrow">{eyebrow}</div> : null}
        <Title
          id={titleId}
          className="ds-page-header-title"
          data-ux={markAsPageTitle ? 'page-title' : undefined}
        >
          {title}
        </Title>
        {description ? <p className="muted ds-page-header-lead">{description}</p> : null}
      </div>
      {actions ? <div className="ds-page-header-actions">{actions}</div> : null}
    </header>
  );
}
