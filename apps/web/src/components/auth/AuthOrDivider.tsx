// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Divider } from '../ui/Divider';

export function AuthOrDivider() {
  const { t } = useTranslation();
  return (
    <div className="auth-or-divider" role="presentation">
      <Divider className="auth-or-divider__line" />
      <span className="auth-or-divider__label">{t('auth.orDivider')}</span>
      <Divider className="auth-or-divider__line" />
    </div>
  );
}
