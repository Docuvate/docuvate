import type { ConnectorPluginCatalogEntryDto } from '@docuvate/contracts';

const PLUGIN_LOGO_SRC: Record<ConnectorPluginCatalogEntryDto['id'], string> = {
  gmail: '/plugin-logos/gmail.svg',
  outlook: '/plugin-logos/microsoftoutlook.svg',
  paperless: '/plugin-logos/paperlessngx.svg',
  home_assistant: '/plugin-logos/homeassistant.svg',
  amazon_s3: '/plugin-logos/amazons3.svg',
};

type PluginIconProps = {
  pluginId: ConnectorPluginCatalogEntryDto['id'];
  className?: string;
};

export function ConnectorPluginIcon({ pluginId, className = '' }: PluginIconProps) {
  const tileClass = `connector-plugin-icon ${className}`.trim();
  const src = PLUGIN_LOGO_SRC[pluginId];
  const alt = '';

  return (
    <div className={tileClass} aria-hidden={alt === '' ? true : undefined}>
      <img className="connector-plugin-logo" src={src} alt={alt} width={28} height={28} />
    </div>
  );
}
