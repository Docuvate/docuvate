# Worker container images

| Image | Dockerfile target | Platforms | PyTorch | Use case |
|-------|-------------------|-----------|---------|----------|
| `docuvate-worker` (default) | `cpu` | `linux/amd64`, `linux/arm64` | CPU wheel index only; CI asserts `pip freeze` has no `nvidia*`, `triton*`, or `cuda-*` packages | Compose, Helm/Kustomize default, homelab CPU |
| `docuvate-worker-gpu` | `gpu` | `linux/amd64` only | CUDA 12.4 wheels + `[donut]` extra | Donut DocVQA and GPU inference |

## Local Compose

Default `docker compose up` builds the **CPU** worker (`target: cpu`).

GPU override:

```bash
docker compose -f docker-compose.yml -f docker-compose.worker-gpu.yml up -d --build worker
```

Requires an NVIDIA GPU, the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), and an amd64 host.

## Kubernetes

- **Kustomize:** base uses `ghcr.io/docuvate/docuvate-worker`. Enable GPU via component `deploy/kustomize/components/gpu-worker` (switches image to `docuvate-worker-gpu`, node selector, GPU limit).
- **Helm:** set `gpuWorker.enabled: true` in values (same image switch as Kustomize).

## Build args

| Arg | CPU default | GPU |
|-----|-------------|-----|
| `WORKER_OPTIONAL_EXTRAS` | empty | `donut` |
| `DOCUVATE_WORKER_TORCH_VARIANT` | `cpu` | `gpu` |

## Size and build time (amd64, CI runner class `ubuntu-latest`, 2026-10-10)

Measured on branch `cursor/worker-cpu-gpu-split-4ce8` vs previous single-stage `apps/worker/Dockerfile` on `main` (`8a727b2`):

| Metric | Before (`main` single Dockerfile) | After (`cpu` target, no cache) |
|--------|-----------------------------------|--------------------------------|
| Image size | 5.13 GB | 5.13 GB |
| `docker build` wall time | ~165 s | ~128 s |

The default worker dependency set already avoided PyTorch on CPU; this split adds an explicit **pip freeze guard** (no `nvidia*`, `triton*`, `cuda-*`) and moves CUDA wheels + `[donut]` to the **gpu** target only. GPU images are larger (CUDA PyTorch) and build only when worker/deploy paths change on PRs (always on `main` publish).

Reranker (`fastembed` `TextCrossEncoder`) uses **ONNX Runtime CPU** in both images — no separate reranker image.
