// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, Minus } from 'lucide-react';
import { type InputHTMLAttributes, type ReactNode,useEffect, useRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({ label, indeterminate, className = '', id, ...props }: CheckboxProps) {
  const showLabel = label !== undefined && label !== null && label !== '';
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate === true;
    }
  }, [indeterminate]);
  return (
    <label className={`checkbox-field${className ? ` ${className}` : ''}`.trim()} htmlFor={id}>
      <input
        {...props}
        id={id}
        type="checkbox"
        className="checkbox-input"
        ref={inputRef}
      />
      <span className="checkbox-box" aria-hidden>
        {indeterminate ? <Minus size={12} strokeWidth={2.5} /> : props.checked ? <Check size={12} strokeWidth={2.5} /> : null}
      </span>
      {showLabel ? <span>{label}</span> : null}
    </label>
  );
}
