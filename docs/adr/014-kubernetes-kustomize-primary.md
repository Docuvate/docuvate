# ADR 014: Kubernetes packaging (Kustomize primary, Helm equivalent)

## Status

Accepted (2026-10-08)

## Context

Docuvate should run on Kubernetes for managed cloud and self-hosting. The project prefers **GitOps with Kustomize** over Helm, but operators should be able to choose either path without divergent behavior.

## Decision

1. **Source of truth:** `deploy/kustomize/` is the canonical, human-readable manifest set (base, overlays, optional components).
2. **Helm:** `deploy/helm/docuvate/` provides an equivalent chart with `values.yaml`, `values-dev.yaml`, `values-homelab.yaml`, and `values-cloud.yaml` that mirror overlay semantics.
3. **Consistency:** CI runs `deploy/scripts/render-and-parity-report.sh` (kubeconform `-strict`, pinned Kubernetes version) and `deploy/scripts/parity_report.py`, which fails on resource set mismatches in **both** directions for `homelab` and `cloud`, plus deployment probe and resource parity for matching workloads.
4. **We do not** generate one format from the other in-repo. Generation would hide diffs in review; dual maintenance is bounded to ~30 resources and guarded by CI.

## Consequences

- GitOps examples default to Kustomize paths.
- Helm users get first-class values files without forking business logic.
- Chart or base changes must keep parity check green.
