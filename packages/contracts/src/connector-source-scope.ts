// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export type ConnectorSourceScopeMode = 'all' | 'selected';

export interface ConnectorSourceScopeDto {
  mode: ConnectorSourceScopeMode;
  paths: string[];
}

export interface ConnectorSourceTreeNodeDto {
  path: string;
  label: string;
  hasChildren: boolean;
  objectCount: number | null;
}
