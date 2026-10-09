// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useDocuvateTheme } from '../lib/useDocuvateTheme';

type SiteLogoProps = {
  className?: string;
};

/** Full mark + wordmark from docs/assets/logo (theme-colored SVGs). */
export function SiteLogo({ className }: SiteLogoProps) {
  const { theme } = useDocuvateTheme();
  const src = theme === 'dark' ? '/brand/logo-dark.svg' : '/brand/logo-light.svg';

  return (
    <img
      src={src}
      alt="Docuvate"
      className={className ? `site-brand-logo ${className}` : 'site-brand-logo'}
      width={240}
      height={48}
      decoding="async"
      fetchPriority="high"
    />
  );
}
