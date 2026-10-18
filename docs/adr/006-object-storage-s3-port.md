# ADR 006: S3-compatible ObjectStorage port

## Status

Accepted

## Context

Docuvate stores original files outside Postgres. Compose ships **MinIO** today; **SeaweedFS** (or any S3-compatible backend) should plug in without domain changes.

## Decision

- Domain and application layers depend on `ObjectStorage`: `putObject`, `getObject`, `deleteObject`.
- Authenticated download/preview is served by the API (`GET /documents/:id/content`) streaming from the port — not presigned URLs — so session auth stays on Fastify.
- Only infrastructure adapters import vendor SDKs (`MinioObjectStorage` now; `SeaweedFSObjectStorage` later).

## Consequences

- Swapping storage is an adapter + compose change, not a document module rewrite.
- Large files are buffered in the API for MVP; streaming from storage through Fastify can follow without changing the port.
