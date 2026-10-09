// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { computeSelectMenuPlacement, resolveSelectMenuPortalRoot } from './selectMenuPlacement';

export interface SelectOption {
  value: string;
  label: string;
  /** Muted secondary text shown after the label (e.g. unavailability reason). */
  suffix?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  /** Render the listbox in a portal (avoids clipping in overflow containers). Default: true. */
  menuPortal?: boolean;
}

function useSelectMenuPosition(
  open: boolean,
  menuPortal: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  menuRef: RefObject<HTMLUListElement | null>,
  optionCount: number
) {
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [menuScrollable, setMenuScrollable] = useState(false);

  const updatePosition = useCallback(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root || !menu) return;

    const trigger = root.querySelector<HTMLElement>('.custom-select-trigger');
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const measuredMenuHeight = menu.scrollHeight || menu.offsetHeight;
    const placement = computeSelectMenuPlacement({
      triggerRect,
      measuredMenuHeight,
      optionCount,
      viewportHeight: window.innerHeight,
    });

    const style: CSSProperties = {
      position: 'fixed',
      top: placement.top,
      left: placement.left,
      width: placement.width,
    };
    if (placement.maxHeight !== undefined) {
      style.maxHeight = placement.maxHeight;
    }
    setMenuStyle(style);
    setMenuScrollable(placement.scrollable);
  }, [menuRef, optionCount, rootRef]);

  useLayoutEffect(() => {
    if (!open || !menuPortal) return;
    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [open, menuPortal, updatePosition]);

  useEffect(() => {
    if (!open || !menuPortal) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, menuPortal, updatePosition]);

  return menuPortal ? { menuStyle, menuScrollable } : undefined;
}

function firstEnabledIndex(options: SelectOption[]): number {
  const idx = options.findIndex((o) => !o.disabled);
  return idx >= 0 ? idx : 0;
}

function nextEnabledIndex(options: SelectOption[], from: number, delta: 1 | -1): number {
  if (options.length === 0) return 0;
  let i = from;
  for (let step = 0; step < options.length; step += 1) {
    i = (i + delta + options.length) % options.length;
    if (!options[i]?.disabled) return i;
  }
  return from;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  'aria-label': ariaLabel,
  className = '',
  menuPortal = true,
}: SelectProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('common.selectPlaceholder');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [portalRoot, setPortalRoot] = useState<HTMLElement>(() => document.body);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const menuPosition = useSelectMenuPosition(open, menuPortal, rootRef, menuRef, options.length);
  const menuStyle = menuPosition?.menuStyle;
  const menuScrollable = menuPosition?.menuScrollable ?? false;

  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (opt: SelectOption) => {
      if (opt.disabled) return;
      onChange(opt.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const openMenu = useCallback(() => {
    if (disabled) return;
    const trigger = triggerRef.current;
    if (trigger) {
      setPortalRoot(resolveSelectMenuPortalRoot(trigger));
    }
    const start = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options);
    setActiveIndex(start);
    setOpen(true);
  }, [disabled, options, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => nextEnabledIndex(options, prev, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => nextEnabledIndex(options, prev, -1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[activeIndex]) selectOption(options[activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  }

  const menu = open ? (
    <ul
      ref={menuRef}
      className={`custom-select-menu${menuPortal ? ' custom-select-menu-portal' : ''}${menuScrollable ? ' custom-select-menu-scrollable' : ''}`}
      role="listbox"
      id={listId}
      style={menuStyle}
    >
      {options.map((opt, index) => (
        <li key={opt.value || '__empty'} role="presentation">
          <button
            type="button"
            role="option"
            id={`${listId}-opt-${index}`}
            aria-selected={opt.value === value}
            disabled={opt.disabled}
            className={`custom-select-option${opt.value === value ? ' custom-select-option-active' : ''}${index === activeIndex ? ' custom-select-option-focus' : ''}${opt.disabled ? ' custom-select-option-disabled' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => selectOption(opt)}
          >
            <span className="custom-select-option-label">{opt.label}</span>
            {opt.suffix ? (
              <span className="custom-select-option-suffix muted">{opt.suffix}</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  const activeOptionId = open ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className={`custom-select ${className}`.trim()} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="custom-select-trigger input"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={selected ? '' : 'muted'}>{selected?.label ?? resolvedPlaceholder}</span>
        <span className="custom-select-caret" aria-hidden>
          ▾
        </span>
      </button>
      {menuPortal && menu ? createPortal(menu, portalRoot) : menu}
    </div>
  );
}
