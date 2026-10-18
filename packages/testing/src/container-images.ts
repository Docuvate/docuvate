// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/**
 * Container images shared with docker-compose.yml (keep byte-identical).
 * Update only with digest pins; run node scripts/testing/verify-container-images.mjs
 */
export const POSTGRES_IMAGE =
  'postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873' as const;

export const VALKEY_IMAGE =
  'valkey/valkey:8-alpine@sha256:081c2f5cb575efc901aa80ff9cdbd1ec6a301682fd35e1ebb4b0990a4a4a8507' as const;

export const MAILPIT_IMAGE =
  'axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48' as const;

export const MINIO_IMAGE =
  'cgr.dev/chainguard/minio@sha256:59667194421209c2c1eacbe761e24787e047985c5dfa96b15da9b59fe9b55cd0' as const;

export const PINNED_TESTCONTAINER_IMAGES = [
  POSTGRES_IMAGE,
  VALKEY_IMAGE,
  MINIO_IMAGE,
  MAILPIT_IMAGE,
] as const;
