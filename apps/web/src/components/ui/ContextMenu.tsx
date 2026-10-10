// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export type ContextMenuEntry =
  | {
      kind: 'item';
      id: string;
      label: string;
      description?: string;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | {
      kind: 'toggleItem';
      id: string;
      label: string;
      checked: boolean | 'mixed';
      onToggle: () => void;
      onRemove?: () => void;
      disabled?: boolean;
    }
  | { kind: 'separator' }
  | {
      kind: 'submenu';
      id: string;
      label: string;
      items: ContextMenuEntry[];
      onSelectParent?: () => void;
    };

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuEntry[];
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  title?: string;
}

export function ContextMenuPanel({
  items,
  onClose,
  depth,
}: {
  items: ContextMenuEntry[];
  onClose: () => void;
  depth: number;
}) {
  const { t } = useTranslation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  return (
    <ul
      className="context-menu-list"
      role="menu"
      aria-label={depth === 0 ? 'Dokumentaktionen' : undefined}
      data-depth={depth}
    >
      {items.map((entry, index) => {
        if (entry.kind === 'separator') {
          return <li key={`sep-${String(index)}`} className="context-menu-separator" role="separator" />;
        }
        if (entry.kind === 'submenu') {
          const canSelectParent = entry.onSelectParent != null;
          return (
            <li
              key={entry.id}
              className="context-menu-item context-menu-item-submenu"
              role="none"
              onMouseEnter={() => { setOpenSubmenu(entry.id); }}
              onMouseLeave={() => { setOpenSubmenu((prev) => (prev === entry.id ? null : prev)); }}
            >
              <button
                type="button"
                className={`context-menu-btn${canSelectParent ? ' context-menu-btn-has-parent-action' : ''}`}
                role="menuitem"
                aria-haspopup="true"
                onClick={() => {
                  if (!canSelectParent) return;
                  entry.onSelectParent?.();
                  onClose();
                }}
              >
                <span>{entry.label}</span>
                <span className="context-menu-caret" aria-hidden>
                  ▸
                </span>
              </button>
              {openSubmenu === entry.id ? (
                <div className="context-menu-flyout">
                  <ContextMenuPanel items={entry.items} onClose={onClose} depth={depth + 1} />
                </div>
              ) : null}
            </li>
          );
        }
        if (entry.kind === 'toggleItem') {
          const ariaChecked = entry.checked === 'mixed' ? 'mixed' : entry.checked;
          const showRemove = entry.checked === true || entry.checked === 'mixed';
          return (
            <li key={entry.id} className="context-menu-toggle-row" role="none">
              <button
                type="button"
                className="context-menu-btn context-menu-toggle-btn"
                role="menuitemcheckbox"
                aria-checked={ariaChecked}
                disabled={entry.disabled}
                onClick={() => {
                  if (entry.disabled) return;
                  entry.onToggle();
                }}
              >
                <span
                  className={`context-menu-check${
                    entry.checked === true
                      ? ' context-menu-check-checked'
                      : entry.checked === 'mixed'
                        ? ' context-menu-check-mixed'
                        : ''
                  }`}
                  aria-hidden
                >
                  {entry.checked === true ? '✓' : null}
                </span>
                <span className="context-menu-toggle-label">{entry.label}</span>
              </button>
              {showRemove ? (
                <button
                  type="button"
                  className="context-menu-remove-btn"
                  aria-label={t('library.contextRemoveLabelAria', { name: entry.label })}
                  disabled={entry.disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (entry.disabled) return;
                    (entry.onRemove ?? entry.onToggle)();
                  }}
                >
                  ×
                </button>
              ) : (
                <span className="context-menu-remove-spacer" aria-hidden />
              )}
            </li>
          );
        }
        return (
          <li key={entry.id} role="none">
            <button
              type="button"
              className={`context-menu-btn${entry.danger ? ' context-menu-btn-danger' : ''}`}
              role="menuitem"
              disabled={entry.disabled}
              onClick={() => {
                if (entry.disabled) return;
                entry.onSelect();
                onClose();
              }}
            >
              <span className="context-menu-item-text">
                <span className="context-menu-item-label">{entry.label}</span>
                {entry.description ? (
                  <span className="context-menu-item-desc muted">{entry.description}</span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ContextMenu({ open, x, y, items, onClose, anchorRef, title }: ContextMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (
        !(event.target instanceof Node) ||
        !rootRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    const anchorEl = anchorRef?.current;
    const menuEl = rootRef.current;
    const pad = 8;
    const gap = 4;
    let left = x;
    let top = y;

    menuEl.style.visibility = 'hidden';
    menuEl.style.left = '0px';
    menuEl.style.top = '0px';

    const menuWidth = menuEl.offsetWidth;
    const menuHeight = menuEl.offsetHeight;

    if (anchorEl instanceof HTMLElement) {
      const anchorRect = anchorEl.getBoundingClientRect();
      left = anchorRect.right - menuWidth;
      top = anchorRect.bottom + gap;
      if (top + menuHeight > window.innerHeight - pad) {
        const above = anchorRect.top - menuHeight - gap;
        if (above >= pad) {
          top = above;
        }
      }
      if (left + menuWidth > window.innerWidth - pad) {
        left = window.innerWidth - pad - menuWidth;
      }
      if (left < pad) {
        left = pad;
      }
    } else {
      if (left + menuWidth > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - menuWidth - pad);
      }
      if (left < pad) {
        left = pad;
      }
    }

    menuEl.style.left = `${String(left)}px`;
    menuEl.style.top = `${String(top)}px`;
    const rect = menuEl.getBoundingClientRect();
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    if (top < pad) {
      top = pad;
    }

    menuEl.style.left = `${String(left)}px`;
    menuEl.style.top = `${String(top)}px`;
    menuEl.style.visibility = '';
  }, [open, x, y, items, anchorRef, title]);

  if (!open) {
    return null;
  }

  const node: ReactNode = (
    <div ref={rootRef} id={menuId} className="context-menu-root" style={{ left: x, top: y }}>
      {title ? (
        <div className="context-menu-title" title={title}>
          {title}
        </div>
      ) : null}
      <ContextMenuPanel items={items} onClose={onClose} depth={0} />
    </div>
  );

  return createPortal(node, document.body);
}
