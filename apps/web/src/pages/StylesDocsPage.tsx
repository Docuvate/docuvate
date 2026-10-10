// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import '@docuvate/ui-catalog/styles.css';

import { StylesCatalog, type StylesCatalogComponents } from '@docuvate/ui-catalog';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';

function CatalogButton({
  variant = 'primary',
  children,
  ...props
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button variant={variant} {...props}>
      {children}
    </Button>
  );
}

function CatalogBadge({ children }: { children: ReactNode }) {
  return <span className="badge badge-ready">{children}</span>;
}

function CatalogAlert({
  children,
  variant = 'info',
}: {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warn' | 'danger';
}) {
  const className =
    variant === 'success'
      ? 'upload-feedback-banner upload-feedback-banner-success'
      : variant === 'danger'
        ? 'upload-feedback-banner upload-feedback-banner-error'
        : variant === 'warn'
          ? 'upload-feedback-banner upload-feedback-banner-mixed'
          : 'info-banner';
  return <div className={className}>{children}</div>;
}

function CatalogCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Card>
      {title ? <h4 className="card-title">{title}</h4> : null}
      {children}
    </Card>
  );
}

function CatalogTabs({ children }: { children: ReactNode }) {
  return <div className="detail-tabs-bar">{children}</div>;
}

function CatalogSelect(props: ComponentProps<typeof Select>) {
  return <Select {...props} />;
}

const catalogComponents = {
  Button: CatalogButton,
  Input,
  Select: CatalogSelect,
  Chip,
  Badge: CatalogBadge,
  Card: CatalogCard,
  Alert: CatalogAlert,
  Tabs: CatalogTabs,
} as StylesCatalogComponents;

export function StylesDocsPage() {
  const { theme, setTheme } = useDocuvateTheme();
  return (
    <div data-ux="page" data-ux-scope="dev">
      <StylesCatalog components={catalogComponents} theme={theme} onThemeChange={setTheme} />
    </div>
  );
}
