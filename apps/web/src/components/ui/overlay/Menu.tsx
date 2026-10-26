// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { OverlayPortalLayer } from './overlayPortal';
import { Popover } from './Popover';

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('Menu components must be used within <Menu>');
  }
  return ctx;
}

export interface MenuProps {
  children: ReactNode;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Menu({ children, open: controlledOpen, onOpenChange }: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
      if (!next) {
        triggerRef.current?.focus();
      }
    },
    [controlledOpen, onOpenChange]
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      menuId,
      triggerRef,
    }),
    [open, setOpen, menuId]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export interface MenuTriggerProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
}

export function MenuTrigger({
  children,
  className,
  'aria-label': ariaLabel,
  disabled = false,
}: MenuTriggerProps) {
  const { open, setOpen, menuId, triggerRef } = useMenuContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      className={className}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => { setOpen(!open); }}
    >
      {children}
    </button>
  );
}

export interface MenuContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
  portalLayer?: OverlayPortalLayer;
}

export function MenuContent({
  children,
  className,
  align = 'end',
  portalLayer = 'popover',
}: MenuContentProps) {
  const { open, setOpen, menuId, triggerRef } = useMenuContext();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const first = panel.querySelector<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"]'
    );
    first?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const panel = panelRef.current;
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('[role="menuitem"], [role="menuitemcheckbox"]')
      ) {
        setOpen(false);
      }
    }
    panel?.addEventListener('click', onClick);
    return () => { panel?.removeEventListener('click', onClick); };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const items = [
        ...panel.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"]'),
      ];
      if (items.length === 0) {
        return;
      }
      const active = document.activeElement;
      const index = items.findIndex((item) => item === active);
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = index < 0 ? 0 : (index + delta + items.length) % items.length;
      items[nextIndex]?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); };
  }, [open]);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      referenceRef={triggerRef}
      returnFocusRef={triggerRef}
      portalLayer={portalLayer}
      placement={align === 'end' ? 'bottom-end' : 'bottom-start'}
      className={className}
      role="menu"
      id={menuId}
    >
      <div ref={panelRef}>{children}</div>
    </Popover>
  );
}
