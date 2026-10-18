// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * Local screenshot tooling only (`VITE_ERROR_SCREENSHOT_HARNESS=true` at dev start).
 * Never set in release image builds.
 */
export function isErrorScreenshotHarnessBuild(): boolean {
  return import.meta.env.VITE_ERROR_SCREENSHOT_HARNESS === 'true';
}

/** Screenshot / design preview routes; disabled in customer production builds. */
export function isErrorScreenPreviewEnabled(): boolean {
  return import.meta.env.DEV || isErrorScreenshotHarnessBuild();
}
