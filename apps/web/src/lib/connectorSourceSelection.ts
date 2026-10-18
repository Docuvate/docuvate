// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export function connectorPluginSupportsSourceSelection(pluginId: string): boolean {
  return pluginId === 'amazon_s3' || pluginId === 'sftp_fetch';
}
