// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Bookmark, Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import {
  type AppSection,
  appSectionOf,
  type DocumentsSubsection,
  documentsSubsectionOf,
} from '../../lib/appNav';
import { routes } from '../../lib/routes';
import { usePinnedSavedViews } from '../../lib/saved-views/usePinnedSavedViews';
import { savedViewSidebarLinkIsActive } from '../../lib/savedViewSidebarNav';
import { useAppRibbonSlot } from './appRibbonContext';

/**
 * Contextual actions of the current screen, rendered into the second header row. Pages own their
 * groups (so actions keep their page context, e.g. the upload target); the shell owns the layout.
 */
export function AppRibbon({ children }: { children: ReactNode }) {
  const slot = useAppRibbonSlot();
  return slot ? createPortal(children, slot) : null;
}

export function RibbonGroup({
  label,
  order,
  children,
}: {
  label: string;
  /** Position among groups portalled by different components of one screen. */
  order?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="ribbon-group"
      role="group"
      aria-label={label}
      style={order === undefined ? undefined : { order }}
    >
      <span className="ribbon-group-label" aria-hidden>
        {label}
      </span>
      <div className="ribbon-group-items">{children}</div>
    </div>
  );
}

function RibbonLink({
  to,
  active,
  label,
  children,
}: {
  to: string;
  active: boolean;
  /** Accessible name when the visible label collapses to an icon. */
  label?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`ribbon-link${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      {children}
    </Link>
  );
}

const DOCUMENT_LINKS: readonly { id: DocumentsSubsection; to: string; labelKey: string }[] = [
  { id: 'all', to: routes.documents, labelKey: 'nav.allDocuments' },
  { id: 'inbox', to: routes.inbox, labelKey: 'nav.inbox' },
  { id: 'review', to: routes.reviewQueue, labelKey: 'nav.review' },
  { id: 'duplicates', to: routes.duplicates, labelKey: 'nav.duplicates' },
];

function DocumentsSectionNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const current = documentsSubsectionOf(location.pathname, location.search);
  const views = usePinnedSavedViews();
  return (
    <>
      <RibbonGroup label={t('ribbon.stock')}>
        {DOCUMENT_LINKS.map((link) => (
          <RibbonLink key={link.id} to={link.to} active={current === link.id}>
            {t(link.labelKey)}
          </RibbonLink>
        ))}
      </RibbonGroup>
      <RibbonGroup label={t('ribbon.views')}>
        <div className="ribbon-saved-views">
          {views.map((view) => {
            const active = savedViewSidebarLinkIsActive(
              location.pathname,
              location.search,
              view.id
            );
            return (
              <Link
                key={view.id}
                to={`${routes.documents}?view=${encodeURIComponent(view.id)}`}
                className={`ribbon-link ribbon-saved-view-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Bookmark size={14} strokeWidth={1.75} aria-hidden />
                {view.name}
              </Link>
            );
          })}
          <RibbonLink
            to={routes.savedViews}
            active={current === 'views'}
            label={t('nav.manageViews')}
          >
            <Settings2 size={14} strokeWidth={1.75} aria-hidden />
            <span className="ribbon-link-label ribbon-link-label--wide">
              {t('nav.manageViews')}
            </span>
          </RibbonLink>
        </div>
      </RibbonGroup>
    </>
  );
}

function FoldersSectionNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <RibbonGroup label={t('ribbon.area')}>
      <RibbonLink to={routes.filesystem} active={pathname !== routes.filesystemUnassigned}>
        {t('nav.folders')}
      </RibbonLink>
      <RibbonLink
        to={routes.filesystemUnassigned}
        active={pathname === routes.filesystemUnassigned}
      >
        {t('nav.unassigned')}
      </RibbonLink>
    </RibbonGroup>
  );
}

function StructureSectionNav({ section }: { section: AppSection }) {
  const { t } = useTranslation();
  return (
    <RibbonGroup label={t('ribbon.structure')}>
      <RibbonLink to={routes.structureLabels} active={section === 'labels'}>
        {t('nav.labels')}
      </RibbonLink>
      <RibbonLink to={routes.structureRecognizedFields} active={section === 'fields'}>
        {t('nav.recognizedFields')}
      </RibbonLink>
    </RibbonGroup>
  );
}

/** Second-level navigation of the current area; first part of the ribbon row. */
export function AppSectionRibbon() {
  const { pathname } = useLocation();
  const section = appSectionOf(pathname);
  let nav: ReactNode = null;
  if (section === 'documents' && !/^\/documents\/(?!views$|duplicates$)[^/]+/.test(pathname)) {
    nav = <DocumentsSectionNav />;
  } else if (section === 'labels' || section === 'fields') {
    nav = <StructureSectionNav section={section} />;
  } else if (section === 'folders') {
    nav = <FoldersSectionNav />;
  }
  return nav ? <div className="app-ribbon-nav">{nav}</div> : null;
}
