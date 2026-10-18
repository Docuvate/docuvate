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

## Size and build time (amd64, 2026-10-10)

Default extra (no `WORKER_OPTIONAL_EXTRAS`):

| Metric | Before (`main` single Dockerfile) | After (`cpu` + `--torch-backend cpu`) |
|--------|-----------------------------------|----------------------------------------|
| Image size | 5.13 GB | 5.13 GB |
| `docker build` wall time | ~165 s | ~128 s |

With **torch-bearing extras** (`WORKER_OPTIONAL_EXTRAS` set at build time):

| Extra | PyPI-first install (old `worker-docker-install.sh`) | `uv pip install --torch-backend cpu` (current) |
|-------|-----------------------------------------------------|------------------------------------------------|
| `docling` | Resolves torch 2.14.1 + triton + 18 `nvidia-*` / `cuda-*` wheels on **aarch64 and amd64** (`uv pip compile` without `--torch-backend cpu`); arm64 builds stall on multi-GB downloads | **amd64 image 6.1 GB**, build ~202 s; `torch==2.14.1+cpu`, freeze assert passes |
| `donut` | Same CUDA resolution on both platforms | **amd64 image 5.94 GB**, build ~279 s; `torch==2.14.1+cpu`, freeze assert passes |

CI runs `scripts/ci/check-worker-cpu-torch-resolution.sh` (`uv pip compile` for `aarch64-unknown-linux-gnu` and `x86_64-unknown-linux-gnu` with extras `""`, `docling`, `donut`) to block CUDA packages from entering the CPU resolution graph.

The default worker dependency set already avoided PyTorch on CPU; extras now use **`--torch-backend cpu` on the first install** (no PyPI CUDA download / reinstall dance). GPU images use `--torch-backend cu124` and build only when worker/deploy paths change on PRs (always on `main` publish).

Reranker (`fastembed` `TextCrossEncoder`) uses **ONNX Runtime CPU** in both images — no separate reranker image.
