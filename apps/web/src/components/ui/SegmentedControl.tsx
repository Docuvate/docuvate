// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  useCallback,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type MutableRefObject,
} from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  ariaLabel: string;
  onChange: (value: T) => void;
  className?: string;
  firstOptionRef?: MutableRefObject<HTMLButtonElement | null>;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
  className = '',
  firstOptionRef,
}: SegmentedControlProps<T>) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusOption = useCallback(
    (index: number) => {
      const enabledIndexes = options
        .map((option, idx) => (option.disabled ? -1 : idx))
        .filter((idx) => idx >= 0);
      if (enabledIndexes.length === 0) {
        return;
      }
      let targetIndex = index;
      if (!enabledIndexes.includes(targetIndex)) {
        targetIndex = enabledIndexes[0]!;
      }
      optionRefs.current[targetIndex]?.focus();
    },
    [options]
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabledIndexes = options
      .map((option, idx) => (option.disabled ? -1 : idx))
      .filter((idx) => idx >= 0);
    const currentIndex = options.findIndex((option) => option.value === value);
    if (enabledIndexes.length === 0 || currentIndex < 0) {
      return;
    }
    const position = enabledIndexes.indexOf(currentIndex);
    if (position < 0) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = enabledIndexes[(position + 1) % enabledIndexes.length]!;
      onChange(options[next]!.value);
      focusOption(next);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length]!;
      onChange(options[next]!.value);
      focusOption(next);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      const next = enabledIndexes[0]!;
      onChange(options[next]!.value);
      focusOption(next);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      const next = enabledIndexes[enabledIndexes.length - 1]!;
      onChange(options[next]!.value);
      focusOption(next);
    }
  }

  return (
    <div
      className={`segmented-control ${className}`.trim()}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const assignRef = (el: HTMLButtonElement | null) => {
          optionRefs.current[index] = el;
          if (index === 0 && firstOptionRef) {
            firstOptionRef.current = el;
          }
        };
        return (
          <button
            key={option.value}
            ref={assignRef}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            tabIndex={selected ? 0 : -1}
            className={`segmented-control__option${selected ? ' segmented-control__option--selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
