// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { routes } from './routes';

export function connectorsOAuthSetupDocUrl(): string {
  const configured = import.meta.env.VITE_CONNECTORS_OAUTH_SETUP_DOC_URL?.trim();
  return configured ?? routes.docsConnectorsOAuthSetup;
}
