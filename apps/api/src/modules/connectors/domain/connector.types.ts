// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type ConnectorTier = 'oss' | 'commercial';

export type ConnectorCategoryId = 'mail' | 'dms' | 'home_automation' | 'storage' | 'scanner_sftp';

export type ConnectorPluginId =
  'gmail' | 'outlook' | 'paperless' | 'home_assistant' | 'amazon_s3' | 'sftp_fetch';

export type ConnectorCapabilityRole = 'source' | 'sink';

export type ConnectorAuthStrategyKind = 'oauth2' | 'bearer' | 'basic' | 'api_key' | 'custom';

export type ConnectorAuthFieldType = 'text' | 'password' | 'url' | 'email';

export interface ConnectorAuthFieldDescriptor {
  key: string;
  labelKey: string;
  type: ConnectorAuthFieldType;
  required: boolean;
  secret?: boolean;
  placeholderKey?: string;
  helpKey?: string;
}

export interface ConnectorOAuthSetup {
  configured: boolean;
  missingEnvVars: string[];
}

export interface ConnectorAuthDescriptor {
  strategy: ConnectorAuthStrategyKind;
  fields: ConnectorAuthFieldDescriptor[];
  oauth?: ConnectorOAuthSetup;
}

export interface ConnectorCategoryDescriptor {
  id: ConnectorCategoryId;
  labelKey: string;
  descriptionKey: string;
}

export interface ConnectorPluginDescriptor {
  id: ConnectorPluginId;
  categoryId: ConnectorCategoryId;
  labelKey: string;
  descriptionKey: string;
  capabilities: ConnectorCapabilityRole[];
  tier: ConnectorTier;
}

export interface ConnectorInstallationEntity {
  id: string;
  userId: string;
  pluginId: ConnectorPluginId;
  displayName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectorConfigurationInput = Record<string, string>;

export interface ConnectorValidationResult {
  ok: boolean;
  messageKey?: string;
}
