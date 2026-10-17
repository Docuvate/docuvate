// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type ClipboardEvent, type KeyboardEvent,useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const CODE_LENGTH = 6;

export interface TwoFactorCodeInputProps {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  idPrefix: string;
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
}

export function TwoFactorCodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  idPrefix,
}: TwoFactorCodeInputProps) {
  const { t } = useTranslation();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const cells = value.padEnd(CODE_LENGTH, ' ').split('').slice(0, CODE_LENGTH);

  useEffect(() => {
    if (value.length === CODE_LENGTH) {
      onComplete?.(value);
    }
  }, [value, onComplete]);

  function focusIndex(index: number) {
    const el = refs.current[index];
    el?.focus();
    el?.select();
  }

  function applyDigits(next: string) {
    const normalized = digitsOnly(next);
    onChange(normalized);
    if (normalized.length < CODE_LENGTH) {
      focusIndex(normalized.length);
    }
  }

  function onDigitChange(index: number, digit: string) {
    const only = digitsOnly(digit);
    if (only.length === 0) {
      const chars = value.split('');
      chars[index] = '';
      onChange(digitsOnly(chars.join('')));
      return;
    }
    if (only.length > 1) {
      applyDigits(`${value.slice(0, index)}${only}`);
      return;
    }
    const chars = value.padEnd(CODE_LENGTH, ' ').split('');
    chars[index] = only;
    const next = digitsOnly(chars.join(''));
    onChange(next);
    if (index < CODE_LENGTH - 1) {
      focusIndex(index + 1);
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !cells[index]?.trim() && index > 0) {
      focusIndex(index - 1);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData('text');
    applyDigits(text);
  }

  return (
    <div className="auth-otp-row" role="group" aria-label={t('auth.twoFactor.codeLabel')}>
      {cells.map((cell, index) => {
        const filled = cell.trim().length > 0;
        const cellId = `${idPrefix}-${String(index)}`;
        return (
          <input
            key={cellId}
            id={cellId}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className={`auth-otp-cell${filled ? ' auth-otp-cell-filled' : ''}`}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={filled ? cell : ''}
            aria-label={t('auth.twoFactor.digitAria', { index: index + 1 })}
            onChange={(event) => {
              onDigitChange(index, event.target.value);
            }}
            onKeyDown={(event) => {
              onKeyDown(index, event);
            }}
            onPaste={onPaste}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
        );
      })}
    </div>
  );
}
