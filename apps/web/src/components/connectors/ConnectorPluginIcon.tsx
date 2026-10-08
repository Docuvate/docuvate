import type { ConnectorPluginCatalogEntryDto } from '@docuvate/contracts';

const PLUGIN_LOGO_SRC: Partial<Record<ConnectorPluginCatalogEntryDto['id'] | 'sftp_scanner', string>> = {
  gmail: '/plugin-logos/gmail.svg',
  outlook: '/plugin-logos/microsoftoutlook.svg',
  paperless: '/plugin-logos/paperlessngx.svg',
  home_assistant: '/plugin-logos/homeassistant.svg',
  amazon_s3: '/plugin-logos/amazons3.svg',
  sftp_fetch: '/plugin-logos/sftp-fetch.svg',
  sftp_scanner: '/plugin-logos/sftp-scanner.svg',
};

type PluginIconProps = {
  pluginId: ConnectorPluginCatalogEntryDto['id'] | 'sftp_scanner';
  className?: string;
};

export function ConnectorPluginIcon({ pluginId, className = '' }: PluginIconProps) {
  const tileClass = `connector-plugin-icon ${className}`.trim();
  const src = PLUGIN_LOGO_SRC[pluginId];
  const alt = '';

  if (!src) {
    return (
      <div className={tileClass} aria-hidden>
        <span className="connector-plugin-logo-fallback" />
      </div>
    );
  }

  return (
    <div className={tileClass} aria-hidden={alt === '' ? true : undefined}>
      <img className="connector-plugin-logo" src={src} alt={alt} width={28} height={28} />
    </div>
  );
}
