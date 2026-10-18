// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  copyErrorDiagnosticsText,
  errorCodeDocPath,
  formatErrorIdForDisplay,
} from '../../lib/errorCodes';
import { IconButton } from '../ui/IconButton';

export interface ErrorCodeDetailsProps {
  code: string;
  requestId: string;
  compact?: boolean;
  className?: string;
}

export function ErrorCodeDetails({ code, requestId, compact = false, className = '' }: ErrorCodeDetailsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const formattedId = formatErrorIdForDisplay(requestId);

  const onCopy = useCallback(async () => {
    const text = copyErrorDiagnosticsText(
      { code, requestId },
      {
        errorCode: t('errors.meta.errorCode'),
        errorId: t('errors.meta.errorId'),
      }
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      setCopied(false);
    }
  }, [code, requestId, t]);

  return (
    <div className={`ds-error-code-details${compact ? ' ds-error-code-details--compact' : ''}${className ? ` ${className}` : ''}`.trim()}>
      <p className="ds-error-code-details-line">
        <span>
          {t('errors.meta.errorCode')} {code} · {t('errors.meta.errorId')} {formattedId}
        </span>
        <IconButton
          type="button"
          size="sm"
          icon={Copy}
          iconSize={13}
          label={copied ? t('errors.meta.copied') : t('errors.meta.copy')}
          onClick={() => { void onCopy(); }}
        />
      </p>
      <Link className="ds-error-code-details-link" to={errorCodeDocPath(code)}>
        {t('errors.meta.whatDoesThisMean')}
      </Link>
    </div>
  );
}
