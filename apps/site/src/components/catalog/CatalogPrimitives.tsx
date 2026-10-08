import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export function CatalogButton({
  variant = 'primary',
  children = null,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button type="button" className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}

export function CatalogInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function CatalogSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder ?? 'Select'}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function CatalogChip({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

export function CatalogBadge({ children }: { children: ReactNode }) {
  return <span className="badge badge-ok">{children}</span>;
}

export function CatalogCard({ children = null, title }: { children?: ReactNode; title?: string }) {
  return (
    <div className="card">
      {title ? <h4>{title}</h4> : null}
      {children}
    </div>
  );
}

export function CatalogAlert({
  children,
  variant = 'info',
}: {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warn' | 'danger';
}) {
  const tone =
    variant === 'success' ? 'badge-ok' : variant === 'danger' ? '' : variant === 'warn' ? 'badge-oauth' : '';
  return <div className={`card ${tone}`.trim()}>{children}</div>;
}

export function CatalogTabs({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 'var(--dv-space-sm)' }}>{children}</div>;
}
