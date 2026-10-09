import { AlertTriangle, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type DocsCalloutProps = {
  variant: 'info' | 'warning';
  children: ReactNode;
};

export function DocsCallout({ variant, children }: DocsCalloutProps) {
  const Icon = variant === 'warning' ? AlertTriangle : Info;
  return (
    <aside className={`docs-callout docs-callout--${variant}`} role="note">
      <Icon className="docs-callout-icon" size={18} aria-hidden />
      <div className="docs-callout-body">{children}</div>
    </aside>
  );
}
