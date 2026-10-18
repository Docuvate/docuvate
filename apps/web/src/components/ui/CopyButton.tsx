// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from './Button';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function CopyButton({ value, label, className = '', disabled = false }: CopyButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copyLabel = label ?? t('common.copy');

  const onCopy = useCallback(async () => {
    if (!value || disabled) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      setCopied(false);
    }
  }, [disabled, value]);

  return (
    <>
      <span className="visually-hidden" aria-live="polite">
        {copied ? t('common.copied') : ''}
      </span>
      <Button
        type="button"
        variant="secondary"
        className={`copy-btn ${className}`.trim()}
        disabled={disabled || !value}
        onClick={() => void onCopy()}
      >
        <Copy size={18} strokeWidth={2} aria-hidden />
        {copied ? t('common.copied') : copyLabel}
      </Button>
    </>
  );
}
