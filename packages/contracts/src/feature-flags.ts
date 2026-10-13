// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Resolved feature flags for the current tenant (remote config). */
export interface FeatureFlagsDto {
  /** Layout reconstruction and SSIM compare (Nachbau / Vergleich) in the document UI. */
  layoutReconstructionCompare: boolean;
  /** SFTP scanner ingress, SFTP fetch, and Paperless-ngx source connectors. */
  sourceConnectors: boolean;
  /** Arena engine compare, non-default extractors, and related research tooling. */
  experimentalResearchModels: boolean;
}

export type FeatureFlagKey = keyof FeatureFlagsDto;

export interface RemoteConfigDto {
  featureFlags: FeatureFlagsDto;
}

export const SOURCE_CONNECTOR_PLUGIN_IDS = ['paperless', 'sftp_fetch'] as const;

export type SourceConnectorPluginId = (typeof SOURCE_CONNECTOR_PLUGIN_IDS)[number];

export function isSourceConnectorPluginId(pluginId: string): boolean {
  for (const id of SOURCE_CONNECTOR_PLUGIN_IDS) {
    if (id === pluginId) {
      return true;
    }
  }
  return false;
}
