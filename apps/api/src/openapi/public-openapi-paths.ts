// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Paths served by Nest but omitted from the committed public OpenAPI (`openapi/docuvate.v1.json`).
 * Browser/session flows and better-auth helpers — not part of the headless integrator surface.
 */
export const PUBLIC_OPENAPI_EXCLUDED_PATH_PREFIXES = ['/auth/', '/sftp-ingress/service/'] as const;

export function isPublicOpenApiExcludedPath(path: string): boolean {
  return PUBLIC_OPENAPI_EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}
