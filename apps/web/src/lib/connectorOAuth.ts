import type { ConnectorPluginCatalogEntryDto } from '@docuvate/contracts';

export function connectorOAuthConfigured(plugin: ConnectorPluginCatalogEntryDto): boolean {
  if (plugin.auth.strategy !== 'oauth2') {
    return true;
  }
  return plugin.auth.oauth?.configured ?? false;
}

export function connectorOAuthMissingEnvVars(plugin: ConnectorPluginCatalogEntryDto): string[] {
  return plugin.auth.oauth?.missingEnvVars ?? [];
}
