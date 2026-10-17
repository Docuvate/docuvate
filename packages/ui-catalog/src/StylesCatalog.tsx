// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ComponentType, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { docuvateThemeAttribute } from '@docuvate/tokens';
import './styles-catalog.css';

export type StylesCatalogComponents = {
  Button: ComponentType<
    ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
      size?: 'md' | 'sm';
    }
  >;
  Input: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
  Select: ComponentType<{
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  }>;
  Chip: ComponentType<{
    label: string;
    color?: string;
    variant?: 'assigned' | 'suggest' | 'inbox' | 'outline' | 'new';
  }>;
  Badge: ComponentType<{ children: ReactNode; tone?: string }>;
  Card: ComponentType<{ children?: ReactNode; title?: string }>;
  Alert: ComponentType<{ children: ReactNode; variant?: 'info' | 'success' | 'warn' | 'danger' }>;
  Tabs: ComponentType<{ children: ReactNode }>;
};

const COLOR_SWATCHES = [
  { name: 'bg', var: '--dv-color-bg' },
  { name: 'bg-raised', var: '--dv-color-bg-raised' },
  { name: 'bg-overlay', var: '--dv-color-bg-overlay' },
  { name: 'bg-muted', var: '--dv-color-bg-muted' },
  { name: 'paper', var: '--dv-color-paper' },
  { name: 'scene-bg', var: '--dv-color-scene-bg' },
  { name: 'text', var: '--dv-color-text' },
  { name: 'text-muted', var: '--dv-color-text-muted' },
  { name: 'border', var: '--dv-color-border' },
  { name: 'accent', var: '--dv-color-accent' },
  { name: 'accent-soft', var: '--dv-color-accent-soft' },
  { name: 'accent-contrast', var: '--dv-color-accent-contrast' },
  { name: 'danger', var: '--dv-color-danger' },
  { name: 'ok', var: '--dv-color-ok' },
] as const;

const TYPE_SAMPLES = [
  { label: '3xl / 56 / bold', className: 'styles-type-3xl', size: 'var(--dv-font-size-3xl)', weight: 'var(--dv-font-weight-bold)' },
  { label: '2xl / 40 / semibold', className: 'styles-type-2xl', size: 'var(--dv-font-size-2xl)', weight: 'var(--dv-font-weight-semibold)' },
  { label: 'xl / 28 / semibold', className: 'styles-type-xl', size: 'var(--dv-font-size-xl)', weight: 'var(--dv-font-weight-semibold)' },
  { label: 'lg / 20 / medium', className: 'styles-type-lg', size: 'var(--dv-font-size-lg)', weight: 'var(--dv-font-weight-medium)' },
  { label: 'md / 16 / regular', className: 'styles-type-md', size: 'var(--dv-font-size-md)', weight: 'var(--dv-font-weight-regular)' },
  { label: 'sm / 14', className: 'styles-type-sm', size: 'var(--dv-font-size-sm)', weight: 'var(--dv-font-weight-regular)' },
  {
    label: 'xs / 12 / mono',
    className: 'styles-type-xs',
    size: 'var(--dv-font-size-xs)',
    weight: 'var(--dv-font-weight-regular)',
    mono: true,
  },
];

const SPACE_SCALE = [
  { token: '2xs', var: '--dv-space-2xs', rem: '0.25rem' },
  { token: 'xs', var: '--dv-space-xs', rem: '0.5rem' },
  { token: 'sm', var: '--dv-space-sm', rem: '0.75rem' },
  { token: 'md', var: '--dv-space-md', rem: '1rem' },
  { token: 'lg', var: '--dv-space-lg', rem: '1.5rem' },
  { token: 'xl', var: '--dv-space-xl', rem: '2rem' },
  { token: '2xl', var: '--dv-space-2xl', rem: '3rem' },
  { token: '3xl', var: '--dv-space-3xl', rem: '4.5rem' },
] as const;

const RADIUS_SCALE = [
  { token: 'sm', var: '--dv-radius-sm', rem: '0.25rem' },
  { token: 'md', var: '--dv-radius-md', rem: '0.5rem' },
  { token: 'lg', var: '--dv-radius-lg', rem: '0.75rem' },
] as const;

const GRID_BREAKPOINTS = [
  { id: 'desktop', columns: 12, gutter: '--dv-grid-desktop-gutter', margin: '--dv-grid-desktop-margin' },
  { id: 'tablet', columns: 12, gutter: '--dv-grid-tablet-gutter', margin: '--dv-grid-tablet-margin' },
  { id: 'mobile', columns: 4, gutter: '--dv-grid-mobile-gutter', margin: '--dv-grid-mobile-margin' },
] as const;

export type StylesCatalogProps = {
  components: StylesCatalogComponents;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
};

export function StylesCatalog({ components, theme, onThemeChange }: StylesCatalogProps) {
  const { Button, Input, Select, Chip, Card, Alert, Tabs } = components;
  const Badge = components.Badge ?? (({ children }: { children: ReactNode }) => <span className="badge">{children}</span>);

  return (
    <article className="styles-catalog">
      <h1>Styles</h1>
      <p className="styles-catalog-lede">
        Style Dictionary tokens in <code>packages/tokens/tokens/*.json</code>. Rebuild with{' '}
        <code>./scripts/packages.sh tokens</code>. Theme attribute:{' '}
        <code>{docuvateThemeAttribute}</code> (<code>light</code> / <code>dark</code>).
      </p>

      <div className="styles-theme-toggle" role="group" aria-label="Theme">
        <Button
          type="button"
          variant={theme === 'light' ? 'primary' : 'secondary'}
          onClick={() => onThemeChange('light')}
        >
          Light
        </Button>
        <Button
          type="button"
          variant={theme === 'dark' ? 'primary' : 'secondary'}
          onClick={() => onThemeChange('dark')}
        >
          Dark
        </Button>
      </div>

      <section className="styles-catalog-section" aria-labelledby="styles-colors">
        <h2 id="styles-colors">Color</h2>
        <p className="muted">Live values follow the page theme.</p>
        <div className="styles-color-grid">
          {COLOR_SWATCHES.map((swatch) => (
            <div key={swatch.var} className="styles-swatch">
              <div
                className="styles-swatch-chip"
                style={{ ['--styles-swatch-bg' as string]: `var(${swatch.var})` }}
              />
              <div className="styles-swatch-meta">
                <div>{swatch.name}</div>
                <code>{swatch.var}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-type">
        <h2 id="styles-type">Type</h2>
        <div className="styles-type-stack">
          {TYPE_SAMPLES.map((row) => (
            <div key={row.label} className="styles-type-row">
              <div
                className="styles-type-sample"
                style={{
                  fontSize: row.size,
                  fontWeight: row.weight,
                  fontFamily:
                    'mono' in row && row.mono
                      ? 'var(--dv-font-family-mono)'
                      : 'var(--dv-font-family-sans)',
                }}
              >
                Docuvate — {row.label}
              </div>
              <span className="styles-type-meta">{row.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-space">
        <h2 id="styles-space">Space</h2>
        <div className="styles-space-row">
          {SPACE_SCALE.map((s) => (
            <div key={s.token} className="styles-space-block">
              <div className="styles-space-bar" style={{ width: `var(${s.var})` }} />
              <div>
                <strong>{s.token}</strong> {s.rem}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-shadow">
        <h2 id="styles-shadow">Shadow</h2>
        <div className="styles-component-grid">
          <div className="styles-swatch" style={{ boxShadow: 'var(--dv-shadow-sm)', padding: 'var(--dv-space-md)' }}>
            sm
          </div>
          <div className="styles-swatch" style={{ boxShadow: 'var(--dv-shadow-md)', padding: 'var(--dv-space-md)' }}>
            md
          </div>
          <div className="styles-swatch" style={{ boxShadow: 'var(--dv-shadow-bar)', padding: 'var(--dv-space-md)' }}>
            bar
          </div>
          <div
            className="styles-swatch"
            style={{ boxShadow: 'var(--dv-shadow-overlay)', padding: 'var(--dv-space-md)' }}
          >
            overlay
          </div>
        </div>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-grid">
        <h2 id="styles-grid">Layout grid</h2>
        <p className="muted">
          Content uses <code>.dv-page-grid</code> + <code>.dv-page-inset-x</code> (see{' '}
          <code>apps/web/src/styles/foundations.css</code>).
        </p>
        <table className="styles-catalog-table">
          <thead>
            <tr>
              <th>Breakpoint</th>
              <th>Columns</th>
              <th>Gutter</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {GRID_BREAKPOINTS.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.columns}</td>
                <td>
                  <code>{row.gutter}</code>
                </td>
                <td>
                  <code>{row.margin}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-motion">
        <h2 id="styles-motion">Motion</h2>
        <p className="muted">
          Durations: fast <code>var(--dv-motion-duration-fast)</code>, normal{' '}
          <code>var(--dv-motion-duration-normal)</code>, slow <code>var(--dv-motion-duration-slow)</code>.
          Easing: <code>var(--dv-motion-easing-standard)</code>.
        </p>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-radius">
        <h2 id="styles-radius">Radius</h2>
        <p className="muted">Max 12px — no pill radii in product UI.</p>
        <div className="styles-radius-row">
          {RADIUS_SCALE.map((r) => (
            <div key={r.token} className="styles-space-block">
              <div className="styles-radius-demo" style={{ borderRadius: `var(${r.var})` }} />
              <div>
                {r.token} {r.rem}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-components">
        <h2 id="styles-components">Components</h2>
        <h3>Buttons</h3>
        <div className="styles-component-grid">
          <Button type="button" variant="primary">
            Primary
          </Button>
          <Button type="button" variant="secondary">
            Secondary
          </Button>
          <Button type="button" variant="ghost">
            Ghost
          </Button>
          <Button type="button" variant="danger">
            Danger
          </Button>
          <Button type="button" size="sm" variant="secondary">
            Small
          </Button>
          <Button type="button" disabled>
            Disabled
          </Button>
        </div>

        <h3>Input &amp; select</h3>
        <div className="styles-component-grid" style={{ flexDirection: 'column', alignItems: 'stretch', maxWidth: '20rem' }}>
          <Input placeholder="Placeholder" defaultValue="" />
          <Select
            value="a"
            options={[
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
            ]}
            onChange={() => undefined}
          />
        </div>

        <h3>Chips &amp; badges</h3>
        <div className="styles-component-grid">
          <Chip label="Default" />
          <Chip label="Inbox" variant="inbox" />
          <Chip label="Suggest" variant="suggest" />
          <Chip label="Neues Label" variant="new" />
          <Badge>Status</Badge>
        </div>

        <h3>Card &amp; alert</h3>
        <Card title="Card title">
          <p>Card body using shared surface tokens.</p>
        </Card>
        <div className="styles-component-grid" style={{ marginTop: 'var(--dv-space-md)' }}>
          <Alert variant="info">Info alert</Alert>
          <Alert variant="success">Success</Alert>
          <Alert variant="warn">Warning</Alert>
          <Alert variant="danger">Danger</Alert>
        </div>

        <h3>Table</h3>
        <table className="styles-catalog-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Invoice Q3</td>
              <td>Ready</td>
            </tr>
            <tr>
              <td>Contract</td>
              <td>Processing</td>
            </tr>
          </tbody>
        </table>

        <h3>Tabs</h3>
        <Tabs>
          <div role="tablist" className="styles-component-grid">
            <Button type="button" variant="secondary">
              Tab A
            </Button>
            <Button type="button" variant="ghost">
              Tab B
            </Button>
          </div>
        </Tabs>
      </section>
    </article>
  );
}
