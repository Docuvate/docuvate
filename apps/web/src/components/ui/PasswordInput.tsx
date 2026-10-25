// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes,useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className = '', id: idProp, disabled, ...props }, ref) {
    const { t } = useTranslation();
    const fallbackId = useId();
    const id = idProp ?? fallbackId;
    const [visible, setVisible] = useState(false);
    const showLabel = t('common.showPassword');
    const hideLabel = t('common.hidePassword');

    return (
      <div className={`password-input-wrap${disabled ? ' password-input-wrap--disabled' : ''}`}>
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          className={`input password-input ${className}`.trim()}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          className="password-input-toggle"
          disabled={disabled}
          aria-label={visible ? hideLabel : showLabel}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => {
            setVisible((prev) => !prev);
          }}
        >
          {visible ? <EyeOff size={18} strokeWidth={2} aria-hidden /> : <Eye size={18} strokeWidth={2} aria-hidden />}
        </button>
      </div>
    );
  }
);
