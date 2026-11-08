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
  triggerRef: RefObject<HTMLButtonElement>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('Menu components must be used within <Menu>');
  }
  return ctx;
}

interface MenuProps {
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

interface MenuTriggerProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  /** Tooltip, e.g. when the visible label collapses to an icon. */
  title?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function MenuTrigger({
  children,
  className,
  'aria-label': ariaLabel,
  title,
  disabled = false,
  'data-testid': testId,
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
      title={title}
      disabled={disabled}
      data-testid={testId}
      onClick={() => {
        setOpen(!open);
      }}
    >
      {children}
    </button>
  );
}

interface MenuContentProps {
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
  // The portal mounts the panel after `open` flips, so effects key off the node itself.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !panel) {
      return;
    }
    const first = panel.querySelector<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
    );
    first?.focus();
  }, [open, panel]);

  useEffect(() => {
    if (!open || !panel) {
      return;
    }
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]'
        )
      ) {
        // Close after React has run the item's own click handler.
        window.setTimeout(() => {
          setOpen(false);
        }, 0);
      }
    }
    panel.addEventListener('click', onClick);
    return () => {
      panel.removeEventListener('click', onClick);
    };
  }, [open, panel, setOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }
      if (!panel) {
        return;
      }
      const items = [
        ...panel.querySelectorAll<HTMLElement>(
          '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'
        ),
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
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, panel]);

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
      <div ref={setPanel}>{children}</div>
    </Popover>
  );
}
