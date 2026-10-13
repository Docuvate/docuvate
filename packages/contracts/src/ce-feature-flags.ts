// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Installation-level CE feature flags (default off). Env-backed on the API; exposed via GET /settings/ce. */
export interface CeFeatureFlagsDto {
  /** Layout reconstruction and SSIM compare (Nachbau / Vergleich) in the document UI. */
  layoutReconstructionCompare: boolean;
  /** SFTP scanner ingress, SFTP fetch, and Paperless-ngx source connectors. */
  sourceConnectors: boolean;
  /** Arena engine compare, non-default extractors, and related research tooling. */
  experimentalResearchModels: boolean;
}

export const CE_SOURCE_CONNECTOR_PLUGIN_IDS = ['paperless', 'sftp_fetch'] as const;

export type CeSourceConnectorPluginId = (typeof CE_SOURCE_CONNECTOR_PLUGIN_IDS)[number];

export function isCeSourceConnectorPluginId(pluginId: string): boolean {
  for (const id of CE_SOURCE_CONNECTOR_PLUGIN_IDS) {
    if (id === pluginId) {
      return true;
    }
  }
  return false;
}
