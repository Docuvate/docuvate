# ADR 005: Shared OTel package

**Status:** accepted

Node services bootstrap tracing only via `packages/otel`. Business layers do not import OTel SDKs.
