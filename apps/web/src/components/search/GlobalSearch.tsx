import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { FileText, Folder, Search, Settings2, Tag, X, Zap } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { GlobalSearchGroupDto, GlobalSearchHitDto } from '@docuvate/contracts';
import { authClient } from '../../lib/auth-client';
import { getConnectorCatalog, globalSearch, listRecognizedFields } from '../../lib/api';
import { suggestFieldNames } from '../../lib/search/fieldNameSuggestions';
import { routes } from '../../lib/routes';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import { parseClientSearchScope } from '../../lib/search/parseSearchScope';
import { searchRegistry } from '../../lib/search/searchRegistry';
import {
  pushRecentSearch,
  readRecentDocuments,
  readRecentSearches,
} from '../../lib/search/searchRecent';
import { searchShortcutLabel } from '../../lib/search/platformShortcut';
import {
  movePaletteGroupTab,
  movePaletteSelection,
  type PaletteItemRef,
} from '../../lib/search/paletteKeyboard';
import { GlobalSearchHighlight } from './GlobalSearchHighlight';

const DEBOUNCE_MS = 150;

function hitRoute(hit: GlobalSearchHitDto): string {
  switch (hit.type) {
    case 'document':
      return routes.document(hit.id);
    case 'folder':
      return routes.filesystemFolder(hit.id);
    case 'label':
      return `${routes.structureLabels}?focus=${encodeURIComponent(hit.id)}`;
    case 'setting':
    case 'action':
      return hit.route;
    default: {
      const _exhaustive: never = hit;
      return _exhaustive;
    }
  }
}

export function GlobalSearch({ narrowTopbar = false }: { narrowTopbar?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [triggerFocused, setTriggerFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiGroups, setApiGroups] = useState<GlobalSearchGroupDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeScopes, setActiveScopes] = useState<string[]>([]);
  const [fieldCatalog, setFieldCatalog] = useState<Array<{ key: string; label: string }>>([]);

  useEffect(() => {
    void getConnectorCatalog()
      .then((c) => setIsAdmin(c.viewerIsServerAdmin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    void listRecognizedFields()
      .then((items) => setFieldCatalog(items.map((f) => ({ key: f.key, label: f.label }))))
      .catch(() => setFieldCatalog([]));
  }, []);

  const parsed = useMemo(() => {
    const prefix =
      activeScopes.length > 0
        ? `${activeScopes.map((s) => `${s}:`).join(' ')} ${query}`.trim()
        : query;
    return parseClientSearchScope(prefix);
  }, [query, activeScopes]);
  const registryHits = useMemo(
    () =>
      searchRegistry(parsed.text, t, isAdmin).map((h) => ({
        type: h.type,
        id: h.id,
        title: h.title,
        description: h.description,
        route: h.route,
        highlightSpans: h.highlightSpans,
        score: h.score,
      })),
    [parsed.text, t, isAdmin]
  );

  const mergedGroups = useMemo((): GlobalSearchGroupDto[] => {
    const scopes = parsed.scopes;
    const allow = (type: GlobalSearchGroupDto['type']) =>
      scopes.length === 0 || scopes.includes(type);

    const groups = [...apiGroups.filter((g) => allow(g.type))];
    if (allow('settings') && registryHits.some((h) => h.type === 'setting')) {
      groups.push({
        type: 'settings',
        total: registryHits.filter((h) => h.type === 'setting').length,
        items: registryHits
          .filter((h) => h.type === 'setting')
          .map((h) => ({
            type: 'setting' as const,
            id: h.id,
            title: h.title,
            description: h.description,
            route: h.route,
            highlightSpans: h.highlightSpans,
            score: h.score,
          })),
        showAllHref: null,
      });
    }
    if (allow('actions') && registryHits.some((h) => h.type === 'action')) {
      groups.push({
        type: 'actions',
        total: registryHits.filter((h) => h.type === 'action').length,
        items: registryHits
          .filter((h) => h.type === 'action')
          .map((h) => ({
            type: 'action' as const,
            id: h.id,
            title: h.title,
            description: h.description,
            route: h.route,
            highlightSpans: h.highlightSpans,
            score: h.score,
          })),
        showAllHref: null,
      });
    }
    return groups;
  }, [apiGroups, parsed.scopes, registryHits]);

  const visibleGroups = useMemo(
    () => mergedGroups.filter((g) => g.items.length > 0),
    [mergedGroups]
  );

  const flatItems: PaletteItemRef[] = useMemo(
    () =>
      visibleGroups.flatMap((g, groupIndex) =>
        g.items.map((item, itemIndex) => ({
          groupIndex,
          itemIndex,
          id: `${item.type}:${item.id}`,
        }))
      ),
    [visibleGroups]
  );

  useDialogFocusTrap(dialogRef, paletteOpen, inputRef);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === '/' && !typing && !paletteOpen) {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape' && paletteOpen) {
        e.preventDefault();
        closePalette();
      }
    }
    window.addEventListener('keydown', onKeyDown as unknown as EventListener);
    return () => window.removeEventListener('keydown', onKeyDown as unknown as EventListener);
  }, [closePalette, openPalette, paletteOpen]);

  useEffect(() => {
    if (!paletteOpen) return;
    const apiQ = parsed.apiQuery || parsed.text.trim();
    if (apiQ.length < 1) {
      setApiGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const types = ['documents', 'folders', 'labels'].join(',');
      void globalSearch({ q: apiQ, types, limit: 8 }, { signal: controller.signal })
        .then((res) => {
          setApiGroups(res.groups);
        })
        .catch(() => {
          if (!controller.signal.aborted) setApiGroups([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [parsed.apiQuery, parsed.text, paletteOpen]);

  const fieldSuggestions = useMemo(() => {
    const tail = query.trim().split(/\s+/).pop() ?? '';
    const m = /^([\p{L}][\p{L}0-9_-]*)$/u.exec(tail);
    if (!m || tail.includes(':')) return [];
    return suggestFieldNames(m[1]!, fieldCatalog);
  }, [query, fieldCatalog]);

  function activateHit(hit: GlobalSearchHitDto, newTab: boolean) {
    const route = hitRoute(hit);
    if (userId && parsed.text.trim()) {
      pushRecentSearch(userId, parsed.text.trim());
    }
    closePalette();
    if (newTab) {
      window.open(route, '_blank', 'noopener');
    } else {
      navigate(route);
    }
  }

  function onPaletteKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveId((prev) => movePaletteSelection(flatItems, prev, 'next'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveId((prev) => movePaletteSelection(flatItems, prev, 'prev'));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setActiveId((prev) => movePaletteGroupTab(flatItems, prev, e.shiftKey ? 'prev' : 'next'));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const id = activeId ?? flatItems[0]?.id;
      const hit = findHitByFlatId(visibleGroups, id);
      if (hit) activateHit(hit, e.metaKey || e.ctrlKey);
    }
  }

  const shortcut = searchShortcutLabel();
  const showEmpty = parsed.text.trim().length === 0;
  const recentSearches = userId ? readRecentSearches(userId) : [];
  const recentDocs = userId ? readRecentDocuments(userId) : [];
  const noResults = !showEmpty && !loading && visibleGroups.length === 0;

  return (
    <>
      <div
        className={`global-search-host${narrowTopbar ? ' global-search-host--narrow' : ' global-search-host--wide'}${triggerFocused || paletteOpen ? ' is-expanded' : ''}`}
      >
        <button
          ref={triggerRef}
          type="button"
          className="global-search-trigger"
          aria-haspopup="dialog"
          aria-expanded={paletteOpen}
          aria-controls={paletteOpen ? listboxId : undefined}
          onClick={() => openPalette()}
          onFocus={() => setTriggerFocused(true)}
          onBlur={() => setTriggerFocused(false)}
        >
          <Search size={18} strokeWidth={1.75} aria-hidden />
          <span className="global-search-trigger-placeholder">{t('search.triggerLabel')}</span>
          <span className="global-search-shortcut" aria-hidden>
            <kbd>{shortcut}</kbd>
          </span>
        </button>
        <button
          type="button"
          className="global-search-mobile-trigger"
          aria-label={t('search.paletteTitle')}
          aria-haspopup="dialog"
          aria-expanded={paletteOpen}
          onClick={() => openPalette()}
        >
          <Search size={22} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {paletteOpen
        ? createPortal(
            <div
              className={`global-search-backdrop${narrowTopbar ? ' global-search-backdrop--narrow' : ''}`}
              onMouseDown={closePalette}
              role="presentation"
            >
              <div
                ref={dialogRef}
                className="global-search-palette"
                role="dialog"
                aria-modal="true"
                aria-label={t('search.paletteTitle')}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={onPaletteKeyDown}
              >
                <div className="global-search-palette-input-row">
                  <Search size={20} strokeWidth={1.75} aria-hidden />
                  <input
                    ref={inputRef}
                    className="global-search-palette-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('shell.searchPlaceholder')}
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-activedescendant={activeId ?? undefined}
                    role="combobox"
                    aria-expanded
                  />
                  <button
                    type="button"
                    className="global-search-palette-close"
                    aria-label={t('search.closePalette')}
                    onClick={closePalette}
                  >
                    <X size={22} strokeWidth={1.75} aria-hidden />
                  </button>
                </div>

                <div className="global-search-scope-chips" role="toolbar" aria-label={t('search.scopeFilters')}>
                  {(['documents', 'folders', 'labels', 'settings', 'actions'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      className={`global-search-scope-chip${activeScopes.includes(scope) ? ' active' : ''}`}
                      aria-pressed={activeScopes.includes(scope)}
                      onClick={() =>
                        setActiveScopes((prev) =>
                          prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
                        )
                      }
                    >
                      {t(`search.groups.${scope}`)}
                    </button>
                  ))}
                </div>

                {fieldSuggestions.length > 0 ? (
                  <div className="global-search-field-suggestions" role="listbox" aria-label={t('search.fieldSuggestions')}>
                    {fieldSuggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="global-search-field-suggestion"
                        onClick={() => {
                          const parts = query.trim().split(/\s+/);
                          parts[parts.length - 1] = `${name}:`;
                          setQuery(`${parts.join(' ')} `);
                        }}
                      >
                        {name}:
                      </button>
                    ))}
                  </div>
                ) : null}

                <div id={listboxId} className="global-search-results" role="listbox">
                  {showEmpty ? (
                    <div className="global-search-empty">
                      {recentSearches.length > 0 ? (
                        <section>
                          <h3>{t('search.recentSearches')}</h3>
                          <ul>
                            {recentSearches.map((s) => (
                              <li key={s}>
                                <button type="button" onClick={() => setQuery(s)}>
                                  {s}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      {recentDocs.length > 0 ? (
                        <section>
                          <h3>{t('search.recentDocuments')}</h3>
                          <ul>
                            {recentDocs.map((d) => (
                              <li key={d.id}>
                                <button
                                  type="button"
                                  onClick={() => navigate(routes.document(d.id))}
                                >
                                  {d.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      <section>
                        <h3>{t('search.quickActions')}</h3>
                        <ul>
                          {searchRegistry('hochladen', t, isAdmin).slice(0, 3).map((a) => (
                            <li key={a.id}>
                              <button type="button" onClick={() => navigate(a.route)}>
                                {a.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  ) : null}

                  {loading ? (
                    <div className="global-search-skeleton" aria-busy="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="global-search-skeleton-row" />
                      ))}
                    </div>
                  ) : null}

                  {!loading && !noResults
                    ? visibleGroups.map((group) => (
                        <section key={group.type} className="global-search-group">
                          <header className="global-search-group-header">
                            <span className="global-search-group-title">
                              {t(`search.groups.${group.type}`)}
                            </span>
                            <span className="global-search-group-count">{group.total}</span>
                          </header>
                          <ul className="global-search-group-list">
                            {group.items.map((hit) => {
                              const flatId = `${hit.type}:${hit.id}`;
                              const active = activeId === flatId;
                              return (
                                <li key={flatId}>
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    id={flatId}
                                    className={`global-search-option${active ? ' active' : ''}`}
                                    onMouseEnter={() => setActiveId(flatId)}
                                    onClick={() => activateHit(hit, false)}
                                  >
                                    <GlobalSearchResultRow hit={hit} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                          {group.showAllHref &&
                          group.total > group.items.length &&
                          group.items.length > 0 ? (
                            <button
                              type="button"
                              className="global-search-show-all"
                              onClick={() => {
                                closePalette();
                                navigate(group.showAllHref!);
                              }}
                            >
                              {t('search.showAll', { count: group.total })}
                            </button>
                          ) : null}
                        </section>
                      ))
                    : null}

                  {noResults ? (
                    <p className="global-search-no-results" role="status">
                      <Trans i18nKey="search.noResults" components={{ code: <code /> }} />
                    </p>
                  ) : null}
                </div>
                {!noResults ? (
                <footer className="global-search-footer global-search-footer-desktop" aria-hidden>
                  <span className="global-search-footer-hint">
                    <kbd>↑</kbd>
                    <kbd>↓</kbd> {t('search.footerNavigate')}
                  </span>
                  <span className="global-search-footer-hint">
                    <kbd>↵</kbd> {t('search.footerOpen')}
                  </span>
                  <span className="global-search-footer-hint">
                    <kbd>Esc</kbd> {t('search.footerClose')}
                  </span>
                </footer>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function findHitByFlatId(
  groups: GlobalSearchGroupDto[],
  flatId: string | null | undefined
): GlobalSearchHitDto | null {
  if (!flatId) return null;
  for (const g of groups) {
    for (const hit of g.items) {
      if (`${hit.type}:${hit.id}` === flatId) return hit;
    }
  }
  return null;
}

function GlobalSearchResultRow({ hit }: { hit: GlobalSearchHitDto }) {
  const { t } = useTranslation();
  if (hit.type === 'document') {
    const meta = [hit.folderPath, hit.documentDate].filter(Boolean).join(' · ');
    return (
      <div className="global-search-result">
        <span className="global-search-result-icon" aria-hidden>
          <FileText size={18} strokeWidth={1.75} />
        </span>
        <span className="global-search-result-body">
          <span className="global-search-result-title">
            <GlobalSearchHighlight text={hit.title} spans={hit.highlightSpans} />
          </span>
          <span className="global-search-snippet muted">
            {hit.matchedFieldLabel ? (
              <>
                <span>{hit.matchedFieldLabel}: </span>
                <GlobalSearchHighlight
                  text={hit.snippet}
                  spans={hit.snippetHighlightSpans ?? hit.highlightSpans}
                />
              </>
            ) : (
              <GlobalSearchHighlight
                text={hit.snippet}
                spans={hit.snippetHighlightSpans ?? hit.highlightSpans}
              />
            )}
          </span>
          {meta ? <span className="global-search-result-meta muted">{meta}</span> : null}
        </span>
      </div>
    );
  }
  if (hit.type === 'folder') {
    return (
      <div className="global-search-result">
        <span className="global-search-result-icon" aria-hidden>
          <Folder size={18} strokeWidth={1.75} />
        </span>
        <span className="global-search-result-body">
          <span className="global-search-result-title">
            <GlobalSearchHighlight text={hit.path} spans={hit.highlightSpans} />
          </span>
          <span className="global-search-result-meta muted">
            {t('search.folderDocumentCount', { count: hit.documentCount })}
          </span>
        </span>
      </div>
    );
  }
  if (hit.type === 'label') {
    return (
      <div className="global-search-result">
        <span className="global-search-result-icon" aria-hidden>
          <Tag size={18} strokeWidth={1.75} />
        </span>
        <span className="global-search-result-body">
          <span className="global-search-result-title">
            <GlobalSearchHighlight text={hit.name} spans={hit.highlightSpans} />
          </span>
        </span>
      </div>
    );
  }
  const Icon = hit.type === 'action' ? Zap : Settings2;
  return (
    <div className="global-search-result">
      <span className="global-search-result-icon" aria-hidden>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="global-search-result-body">
        <span className="global-search-result-title">
          <GlobalSearchHighlight text={hit.title} spans={hit.highlightSpans} />
        </span>
        {hit.description ? (
          <span className="global-search-result-meta muted">{hit.description}</span>
        ) : null}
      </span>
    </div>
  );
}
