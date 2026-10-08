import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

type SettingsSectionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  id?: string;
  compact?: boolean;
};

export function SettingsSectionCard({
  icon,
  title,
  description,
  children = null,
  footer,
  className = '',
  id,
  compact = false,
}: SettingsSectionCardProps) {
  return (
    <Card
      id={id}
      className={`settings-section-card settings-section-card--stretch settings-section-card--with-footer${compact ? ' settings-section-card--compact' : ''} ${className}`.trim()}
    >
      <div className="settings-section-header">
        <div className="settings-section-icon" aria-hidden>
          {icon}
        </div>
        <div className="settings-section-heading">
          <h2>{title}</h2>
          <p className="muted settings-lead">{description}</p>
        </div>
      </div>
      <div className="settings-section-body">
        {children}
        <div className="settings-section-card-spacer" aria-hidden />
        {footer}
      </div>
    </Card>
  );
}
