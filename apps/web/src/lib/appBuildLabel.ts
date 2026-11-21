// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Semver from package.json, injected at Vite build/dev time. */
function appSemver(): string {
  return __DOCUVATE_APP_VERSION__;
}

/** Normalize a git SHA (or env placeholder) to the footer short form. */
export function shortBuildSha(raw: string): string {
  const sha = raw.trim();
  if (!sha || sha === 'unknown') {
    return 'dev';
  }
  return sha.length > 8 ? sha.slice(0, 8) : sha;
}

/** Short git SHA (or `dev` / env override). */
function appBuildShaShort(): string {
  const raw =
    (typeof window !== 'undefined' ? window.__DOCUVATE_BUILD_SHA__ : undefined) ??
    __DOCUVATE_BUILD_SHA__;
  return shortBuildSha(raw);
}

/** Footer label: `0.1.1+c5d0ad23`. */
export function formatAppBuildLabel(semver: string, shaRaw: string): string {
  return `${semver}+${shortBuildSha(shaRaw)}`;
}

/** Footer label from Vite-injected build metadata. */
export function appBuildLabel(): string {
  return `${appSemver()}+${appBuildShaShort()}`;
}
