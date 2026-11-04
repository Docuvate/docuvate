// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Breadcrumb } from '../ui/Breadcrumb';
import type { BreadcrumbItem } from '../ui/breadcrumbItem';

export function SettingsBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useTranslation();
  return (
    <Breadcrumb
      items={items}
      className="settings-breadcrumb"
      ariaLabel={t('settings.breadcrumbAria')}
    />
  );
}
