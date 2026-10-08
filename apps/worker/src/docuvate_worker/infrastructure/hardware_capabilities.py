from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Literal

logger = logging.getLogger(__name__)

InferenceDevice = Literal["cuda", "mps", "rocm", "cpu"]

# Donut DocVQA (~800MB weights + activations); see docs/adr/010-cpu-docqa.md
HEAVY_VISION_MIN_VRAM_MB = 4096
LARGE_LOCAL_LLM_MIN_VRAM_MB = 6144


@dataclass(frozen=True)
class HardwareCapabilities:
    device: InferenceDevice
    vram_mb: int
    gpu_available: bool
    heavy_vision: bool
    large_local_llm: bool
    cpu_rag: bool

    def as_api_dict(self) -> dict[str, object]:
        return {
            "device": self.device,
            "vramMb": self.vram_mb,
            "gpuAvailable": self.gpu_available,
            "capabilities": {
                "heavyVision": self.heavy_vision,
                "largeLocalLlm": self.large_local_llm,
                "cpuRag": self.cpu_rag,
            },
        }


_cached: HardwareCapabilities | None = None


def _import_torch():
    import torch

    return torch


def _read_int_env(name: str) -> int | None:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def _cuda_vram_mb(torch) -> int:
    override = _read_int_env("DOCUVATE_CUDA_VRAM_MB")
    if override is not None:
        return max(0, override)
    if not torch.cuda.is_available():
        return 0
    props = torch.cuda.get_device_properties(0)
    return int(props.total_memory // (1024 * 1024))


def _mps_vram_mb() -> int:
    override = _read_int_env("DOCUVATE_MPS_VRAM_MB")
    if override is not None:
        return max(0, override)
    # Unified memory — conservative default when exact VRAM is unknown.
    return 8192


def _is_rocm(torch) -> bool:
    hip = getattr(torch.version, "hip", None)
    return hip is not None and bool(hip)


def detect_hardware_capabilities(*, force_refresh: bool = False) -> HardwareCapabilities:
    global _cached
    if _cached is not None and not force_refresh:
        return _cached

    device: InferenceDevice = "cpu"
    vram_mb = 0
    gpu_available = False

    try:
        torch = _import_torch()
    except ImportError:
        report = HardwareCapabilities(
            device="cpu",
            vram_mb=0,
            gpu_available=False,
            heavy_vision=False,
            large_local_llm=False,
            cpu_rag=True,
        )
        _cached = report
        return report

    cuda_ok = bool(torch.cuda.is_available())
    mps_backend = getattr(torch.backends, "mps", None)
    mps_ok = bool(mps_backend is not None and mps_backend.is_available())

    if cuda_ok and _is_rocm(torch):
        device = "rocm"
        vram_mb = _cuda_vram_mb(torch)
        gpu_available = True
    elif cuda_ok:
        device = "cuda"
        vram_mb = _cuda_vram_mb(torch)
        gpu_available = True
    elif mps_ok:
        device = "mps"
        vram_mb = _mps_vram_mb()
        gpu_available = True

    heavy_vision = gpu_available and vram_mb >= HEAVY_VISION_MIN_VRAM_MB
    large_local_llm = gpu_available and vram_mb >= LARGE_LOCAL_LLM_MIN_VRAM_MB

    report = HardwareCapabilities(
        device=device,
        vram_mb=vram_mb,
        gpu_available=gpu_available,
        heavy_vision=heavy_vision,
        large_local_llm=large_local_llm,
        cpu_rag=True,
    )
    _cached = report
    logger.info(
        "Hardware capabilities: device=%s vram_mb=%s gpu=%s heavyVision=%s largeLocalLlm=%s",
        report.device,
        report.vram_mb,
        report.gpu_available,
        report.heavy_vision,
        report.large_local_llm,
    )
    return report


def heavy_vision_capable() -> bool:
    return detect_hardware_capabilities().heavy_vision
