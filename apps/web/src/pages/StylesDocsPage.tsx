// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import '@docuvate/ui-catalog/styles.css';

import { StylesCatalog, type StylesCatalogComponents } from '@docuvate/ui-catalog';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { InlineStatus } from '../components/ui/InlineStatus';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Tab, TabBar } from '../components/ui/Tab';
import { type BadgeTone, ToneBadge } from '../components/ui/ToneBadge';
import { Toolbar,ToolGroup } from '../components/ui/Toolbar';
import { useDocuvateTheme } from '../lib/useDocuvateTheme';
import { DesignSystemShowcase } from './DesignSystemShowcase';

function CatalogBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <ToneBadge tone={tone}>{children}</ToneBadge>;
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

function CatalogCard({
  children,
  title,
  description,
  actions,
}: {
  children?: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Card>
      {title ? <CardHeader as="h4" title={title} description={description} actions={actions} /> : null}
      {children}
    </Card>
  );
}

function CatalogTabs({ items, activeIndex }: { items: readonly string[]; activeIndex: number }) {
  return (
    <TabBar>
      {items.map((item, index) => (
        <Tab key={item} active={index === activeIndex}>
          {item}
        </Tab>
      ))}
    </TabBar>
  );
}

function CatalogPageHeader(props: { title: string; description?: string; actions?: ReactNode }) {
  return <PageHeader {...props} titleAs="h2" markAsPageTitle={false} />;
}

function CatalogToolbar({ label, groups }: { label: string; groups: readonly ReactNode[] }) {
  return (
    <Toolbar aria-label={label} justify="between">
      <ToolGroup>{groups.slice(0, 1)}</ToolGroup>
      <ToolGroup>{groups.slice(1)}</ToolGroup>
    </Toolbar>
  );
}

function CatalogSelect(props: ComponentProps<typeof Select>) {
  return <Select {...props} />;
}

const catalogComponents: StylesCatalogComponents = {
  Button,
  Input,
  Select: CatalogSelect,
  Chip,
  Badge: CatalogBadge,
  Card: CatalogCard,
  Alert: CatalogAlert,
  Tabs: CatalogTabs,
  PageHeader: CatalogPageHeader,
  Toolbar: CatalogToolbar,
  InlineStatus,
};

export function StylesDocsPage() {
  const { theme, setTheme } = useDocuvateTheme();
  return (
    <div data-ux="page" data-ux-scope="dev">
      <StylesCatalog components={catalogComponents} theme={theme} onThemeChange={setTheme} />
      <div className="styles-catalog">
        <DesignSystemShowcase />
      </div>
    </div>
  );
}
