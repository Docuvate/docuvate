// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  type ColorCatalogEntry,
  colorCatalog,
  docuvateThemeAttribute,
  type TokenCatalogEntry,
  tokenCatalog,
} from '@docuvate/tokens';
import type { ButtonHTMLAttributes, ComponentType, InputHTMLAttributes, ReactNode } from 'react';

import './styles-catalog.css';
import {
  COMPONENT_GUIDELINES,
  type ComponentGuideline,
  DESIGN_PRINCIPLES,
  GOVERNANCE_RULES,
} from './guidelines';

type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'info';

export type StylesCatalogComponents = {
  Button: ComponentType<
    ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
      size?: 'md' | 'sm';
      loading?: boolean;
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
  Badge: ComponentType<{ children: ReactNode; tone?: Tone }>;
  Card: ComponentType<{ children?: ReactNode; title?: string; description?: string; actions?: ReactNode }>;
  Alert: ComponentType<{ children: ReactNode; variant?: 'info' | 'success' | 'warn' | 'danger' }>;
  Tabs: ComponentType<{ items: readonly string[]; activeIndex: number }>;
  PageHeader: ComponentType<{ title: string; description?: string; actions?: ReactNode }>;
  Toolbar: ComponentType<{ label: string; groups: readonly ReactNode[] }>;
  InlineStatus: ComponentType<{ tone?: 'neutral' | 'loading' | 'success' | 'warn' | 'error'; children: ReactNode }>;
};

export type StylesCatalogProps = {
  components: StylesCatalogComponents;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
};

const COLOR_GROUPS: readonly { id: string; title: string; match: (role: string) => boolean }[] = [
  { id: 'surface', title: 'Surfaces', match: (r) => r.startsWith('bg') || ['paper', 'scene-bg', 'scrim', 'overlay-backdrop', 'overlay-tint'].includes(r) },
  { id: 'text', title: 'Text', match: (r) => r.startsWith('text') || r === 'progress-label' || r.startsWith('on-') || r === 'error-text' },
  { id: 'border', title: 'Borders & focus', match: (r) => r.startsWith('border') || r === 'focus' },
  { id: 'accent', title: 'Accent (brand)', match: (r) => r.startsWith('accent') },
  { id: 'status', title: 'Status', match: (r) => /^(danger|ok|warn|inbox|suggest)/.test(r) },
  { id: 'header', title: 'App header', match: (r) => r.startsWith('header') },
  { id: 'labels', title: 'Labels & chips', match: (r) => r.startsWith('label') || r.startsWith('chip') || r === 'tag-unlabeled' },
  { id: 'data', title: 'Charts, tables & PDF chrome', match: () => true },
];

function groupColors(entries: readonly ColorCatalogEntry[]) {
  const remaining = [...entries];
  return COLOR_GROUPS.map((group) => {
    const items = remaining.filter((entry) => group.match(entry.role));
    for (const item of items) remaining.splice(remaining.indexOf(item), 1);
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}

function tokensIn(group: string): readonly TokenCatalogEntry[] {
  return tokenCatalog.filter((t) => t.group === group);
}

function tokensWithPrefix(prefix: string): readonly TokenCatalogEntry[] {
  return tokenCatalog.filter((t) => t.id.startsWith(prefix));
}

const TYPE_ROLES = [...new Set(tokensIn('type').map((t) => t.id.split('.')[1] ?? ''))].filter(Boolean);

const SECTIONS: readonly (readonly [string, string])[] = [
  ['principles', 'Principles'],
  ['color', 'Colour'],
  ['type', 'Typography'],
  ['space', 'Spacing & layout'],
  ['shape', 'Radius, borders & focus'],
  ['elevation', 'Elevation & layers'],
  ['motion', 'Motion'],
  ['components', 'Components'],
  ['governance', 'Governance'],
  ['reference', 'Token reference'],
];

function TokenTable({ entries, caption }: { entries: readonly TokenCatalogEntry[]; caption: string }) {
  return (
    <div className="styles-table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="styles-catalog-table">
        <caption className="styles-visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
            <th scope="col">Usage</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((t) => (
            <tr key={t.id}>
              <td>
                <code>{t.cssVar}</code>
              </td>
              <td>
                <code>{t.aliasOf ? `{${t.aliasOf}}` : t.value}</code>
                {t.aliasOf ? <span className="styles-muted"> → {t.resolved}</span> : null}
              </td>
              <td className="styles-muted">{t.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Guideline({ guide, children }: { guide: ComponentGuideline; children: ReactNode }) {
  return (
    <section className="styles-guide" aria-labelledby={`guide-${guide.id}`}>
      <header className="styles-guide-head">
        <h3 id={`guide-${guide.id}`}>{guide.name}</h3>
        <code className="styles-muted">{guide.source}</code>
      </header>
      <p>{guide.whenToUse}</p>
      <div className="styles-guide-demo">{children}</div>
      <div className="styles-guide-grid">
        <div>
          <h4>States</h4>
          <ul>
            {guide.states.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="styles-guide-do">
          <h4>Do</h4>
          <ul>
            {guide.dos.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="styles-guide-dont">
          <h4>Don’t</h4>
          <ul>
            {guide.donts.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function guideById(id: string): ComponentGuideline {
  const found = COMPONENT_GUIDELINES.find((g) => g.id === id);
  if (!found) throw new Error(`Unknown component guideline ${id}`);
  return found;
}

export function StylesCatalog({ components, theme, onThemeChange }: StylesCatalogProps) {
  const { Button, Input, Select, Chip, Badge, Card, Alert, Tabs, PageHeader, Toolbar, InlineStatus } = components;
  const colorGroups = groupColors(colorCatalog);

  return (
    <article className="styles-catalog" data-testid="styles-catalog">
      <header className="styles-catalog-hero">
        <p className="styles-eyebrow">Docuvate design system</p>
        <h1>Styles &amp; components</h1>
        <p className="styles-catalog-lede">
          Generated from <code>packages/tokens/tokens/*.json</code> ({String(tokenCatalog.length)} tokens,{' '}
          {String(colorCatalog.length)} colour roles). Themes switch with <code>{docuvateThemeAttribute}</code>.
        </p>
        <div className="styles-theme-toggle" role="group" aria-label="Theme">
          <Button
            type="button"
            variant={theme === 'light' ? 'primary' : 'secondary'}
            aria-pressed={theme === 'light'}
            onClick={() => {
              onThemeChange('light');
            }}
          >
            Light
          </Button>
          <Button
            type="button"
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            aria-pressed={theme === 'dark'}
            onClick={() => {
              onThemeChange('dark');
            }}
          >
            Dark
          </Button>
        </div>
        <nav className="styles-toc" aria-label="Catalog sections">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#styles-${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="styles-catalog-section" aria-labelledby="styles-principles">
        <h2 id="styles-principles">Principles</h2>
        <ol className="styles-principles">
          {DESIGN_PRINCIPLES.map((p) => (
            <li key={p.title}>
              <strong>{p.title}</strong>
              <span>{p.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-color">
        <h2 id="styles-color">Colour</h2>
        <p className="styles-muted">
          Palette is frozen (light / dark parity). Swatches follow the current theme; both hex values are listed.
        </p>
        {colorGroups.map((group) => (
          <div key={group.id} className="styles-color-group">
            <h3>{group.title}</h3>
            <div className="styles-color-grid">
              {group.items.map((swatch) => (
                <div key={swatch.cssVar} className="styles-swatch">
                  <div className="styles-swatch-chip" style={{ background: `var(${swatch.cssVar})` }} />
                  <div className="styles-swatch-meta">
                    <div className="styles-swatch-name">{swatch.role}</div>
                    <code>{swatch.cssVar}</code>
                    <code>
                      {swatch.light} / {swatch.dark ?? '—'}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-type">
        <h2 id="styles-type">Typography</h2>
        <p className="styles-muted">
          Use the semantic <code>--dv-type-*</code> roles; raw <code>--dv-font-size-*</code> only for exceptions.
        </p>
        <div className="styles-type-stack">
          {TYPE_ROLES.map((role) => (
            <div key={role} className="styles-type-row">
              <div
                className="styles-type-sample"
                style={{
                  fontSize: `var(--dv-type-${role}-size)`,
                  lineHeight: `var(--dv-type-${role}-line-height)`,
                  fontWeight: `var(--dv-type-${role}-weight)`,
                  letterSpacing: `var(--dv-type-${role}-tracking)`,
                  textTransform: role === 'overline' ? 'uppercase' : undefined,
                }}
              >
                Belege schneller finden
              </div>
              <code className="styles-type-meta">
                --dv-type-{role}-* ·{' '}
                {tokensWithPrefix(`type.${role}.size`)[0]?.resolved ?? ''}
              </code>
            </div>
          ))}
        </div>
        <TokenTable entries={tokensWithPrefix('font.')} caption="Font primitives" />
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-space">
        <h2 id="styles-space">Spacing &amp; layout</h2>
        <p className="styles-muted">4px base, 8px rhythm. Gaps between groups grow with hierarchy: xs inside a group, md between groups, lg between sections.</p>
        <div className="styles-space-row">
          {tokensIn('space').map((s) => (
            <div key={s.id} className="styles-space-block">
              <div className="styles-space-bar" style={{ width: `var(${s.cssVar})` }} />
              <div>
                <strong>{s.id.replace('space.', '')}</strong> {s.resolved}
              </div>
            </div>
          ))}
        </div>
        <h3>Controls</h3>
        <TokenTable entries={tokensIn('control')} caption="Control size tokens" />
        <h3>Layout</h3>
        <TokenTable entries={[...tokensIn('layout'), ...tokensIn('breakpoint')]} caption="Layout tokens" />
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-shape">
        <h2 id="styles-shape">Radius, borders &amp; focus</h2>
        <p className="styles-muted">Radius caps at 12px — no pill shapes. Controls use md, surfaces lg.</p>
        <div className="styles-radius-row">
          {tokensIn('radius').map((r) => (
            <div key={r.id} className="styles-space-block">
              <div className="styles-radius-demo" style={{ borderRadius: `var(${r.cssVar})` }} />
              <div>{r.id.replace('radius.', '')}</div>
            </div>
          ))}
        </div>
        <div className="styles-focus-demo">
          <Button type="button" variant="secondary" className="styles-focus-forced">
            Focus ring
          </Button>
          <span className="styles-muted">
            <code>outline: var(--dv-focus-ring-width) solid var(--dv-color-focus)</code>
          </span>
        </div>
        <TokenTable entries={[...tokensIn('border'), ...tokensIn('focus'), ...tokensIn('state')]} caption="Border, focus and state tokens" />
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-elevation">
        <h2 id="styles-elevation">Elevation &amp; layers</h2>
        <div className="styles-elevation-row">
          {tokensIn('elevation').map((e) => (
            <div key={e.id} className="styles-elevation-card" style={{ boxShadow: `var(${e.cssVar})` }}>
              <strong>{e.id.replace('elevation.', 'Level ')}</strong>
              <span className="styles-muted">{e.comment}</span>
            </div>
          ))}
        </div>
        <h3>Layers (z-index)</h3>
        <TokenTable entries={tokensIn('z')} caption="Layer tokens" />
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-motion">
        <h2 id="styles-motion">Motion</h2>
        <p className="styles-muted">
          Motion confirms cause and effect; it never delays work. All durations collapse to 0.01ms under{' '}
          <code>prefers-reduced-motion: reduce</code> (generated with the tokens).
        </p>
        <TokenTable entries={tokensIn('motion')} caption="Motion tokens" />
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-components">
        <h2 id="styles-components">Components</h2>

        <Guideline guide={guideById('page-header')}>
          <div className="styles-frame">
            <PageHeader
              title="Labels"
              description="Labels gruppieren Dokumente nach Thema oder Art."
              actions={
                <Button type="button" variant="primary">
                  Neues Label
                </Button>
              }
            />
          </div>
        </Guideline>

        <Guideline guide={guideById('button')}>
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
            <Button type="button" variant="primary" loading>
              Loading
            </Button>
            <Button type="button" disabled>
              Disabled
            </Button>
          </div>
        </Guideline>

        <Guideline guide={guideById('input')}>
          <div className="styles-form-demo">
            <label className="styles-field">
              <span>Titel</span>
              <Input placeholder="z. B. Stromrechnung" defaultValue="" />
            </label>
            <label className="styles-field">
              <span>Ungültig</span>
              <Input className="input-invalid" defaultValue="31.02.2026" aria-invalid="true" />
            </label>
            <label className="styles-field">
              <span>Deaktiviert</span>
              <Input disabled defaultValue="Nur Lesen" />
            </label>
            <Select
              value="a"
              options={[
                { value: 'a', label: 'Zuletzt geändert' },
                { value: 'b', label: 'Titel A–Z' },
              ]}
              onChange={() => undefined}
            />
          </div>
        </Guideline>

        <Guideline guide={guideById('card')}>
          <Card
            title="Texterkennung"
            description="So liest Docuvate Text aus neu hochgeladenen Dateien."
            actions={
              <Button type="button" variant="secondary" size="sm">
                Ändern
              </Button>
            }
          >
            <p className="styles-muted">Card body using surface, border and elevation tokens.</p>
          </Card>
        </Guideline>

        <Guideline guide={guideById('toolbar')}>
          <Toolbar
            label="Dokumente filtern"
            groups={[
              <Input key="q" placeholder="Suche nach Titel…" aria-label="Suche" />,
              <Button key="f" type="button" variant="secondary">
                Filter
              </Button>,
              <Button key="e" type="button" variant="ghost">
                Exportieren
              </Button>,
            ]}
          />
        </Guideline>

        <Guideline guide={guideById('tabs')}>
          <Tabs items={['Details', 'Labels', 'Felder']} activeIndex={0} />
        </Guideline>

        <Guideline guide={guideById('badge')}>
          <div className="styles-component-grid">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="accent">Neu</Badge>
            <Badge tone="success">Bereit</Badge>
            <Badge tone="warn">Prüfen</Badge>
            <Badge tone="danger">Fehler</Badge>
            <Badge tone="info">Posteingang</Badge>
            <Chip label="Rechnung" color="#3b82f6" variant="assigned" />
            <Chip label="Vorschlag" variant="suggest" />
            <Chip label="Neues Label" variant="new" />
          </div>
        </Guideline>

        <Guideline guide={guideById('feedback')}>
          <div className="styles-stack">
            <InlineStatus tone="loading">Dokumente werden geladen…</InlineStatus>
            <InlineStatus>Noch keine Duplikate gefunden.</InlineStatus>
            <InlineStatus tone="success">Gespeichert.</InlineStatus>
            <InlineStatus tone="warn">Einige Felder brauchen eine Prüfung.</InlineStatus>
            <InlineStatus tone="error">Verbindung fehlgeschlagen. Bitte erneut versuchen.</InlineStatus>
            <Alert variant="info">Info banner</Alert>
          </div>
        </Guideline>

        <Guideline guide={guideById('table')}>
          <div className="styles-table-wrap" tabIndex={0} role="region" aria-label="Beispieltabelle">
            <table className="styles-catalog-table styles-data-table">
              <thead>
                <tr>
                  <th scope="col">Dokument</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="styles-num">
                    Seiten
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Beispielrechnung 0001</td>
                  <td>
                    <Badge tone="success">Bereit</Badge>
                  </td>
                  <td className="styles-num">2</td>
                </tr>
                <tr aria-selected="true" className="styles-row-selected">
                  <td>Beispielvertrag 0002</td>
                  <td>
                    <Badge tone="accent">Texterkennung</Badge>
                  </td>
                  <td className="styles-num">14</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Guideline>

        <Guideline guide={guideById('dialog')}>
          <div className="styles-dialog-preview" aria-hidden>
            <div className="styles-dialog-preview-title">Label löschen?</div>
            <p className="styles-muted">Das Label wird von 4 Dokumenten entfernt.</p>
            <div className="styles-dialog-preview-actions">
              <span className="btn btn-secondary">Abbrechen</span>
              <span className="btn btn-danger">Löschen</span>
            </div>
          </div>
        </Guideline>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-governance">
        <h2 id="styles-governance">Governance</h2>
        <ol className="styles-governance">
          {GOVERNANCE_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      <section className="styles-catalog-section" aria-labelledby="styles-reference">
        <h2 id="styles-reference">Token reference</h2>
        <TokenTable entries={tokenCatalog} caption="All static tokens" />
      </section>
    </article>
  );
}
