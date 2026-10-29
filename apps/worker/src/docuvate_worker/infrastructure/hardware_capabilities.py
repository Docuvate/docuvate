# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import importlib.util
import json
import logging
import os
import subprocess
import sys
from dataclasses import dataclass
from types import ModuleType
from typing import Literal, cast

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


def _import_torch() -> ModuleType:
    import torch  # noqa: PLC0415

    return cast(ModuleType, torch)


def _read_int_env(name: str) -> int | None:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def _cuda_vram_mb(torch: ModuleType) -> int:
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


def _is_rocm(torch: ModuleType) -> bool:
    hip = getattr(torch.version, "hip", None)
    return hip is not None and bool(hip)


@dataclass(frozen=True)
class AcceleratorProbe:
    device: InferenceDevice
    vram_mb: int


_CPU_PROBE = AcceleratorProbe(device="cpu", vram_mb=0)
_DEVICES_BY_NAME: dict[str, InferenceDevice] = {
    "cuda": "cuda",
    "mps": "mps",
    "rocm": "rocm",
    "cpu": "cpu",
}
_PROBE_TIMEOUT_SEC = 120
_PROBE_SCRIPT = (
    "import json\n"
    "from docuvate_worker.infrastructure.hardware_capabilities import "
    "probe_accelerator_in_process\n"
    "probe = probe_accelerator_in_process()\n"
    "print(json.dumps({'device': probe.device, 'vramMb': probe.vram_mb}))\n"
)


def probe_accelerator_in_process() -> AcceleratorProbe:
    """Import torch in the current process and read the accelerator (probe child only)."""
    try:
        torch = _import_torch()
    except ImportError:
        return _CPU_PROBE
    cuda_ok = bool(torch.cuda.is_available())
    mps_backend = getattr(torch.backends, "mps", None)
    mps_ok = bool(mps_backend is not None and mps_backend.is_available())
    if cuda_ok and _is_rocm(torch):
        return AcceleratorProbe(device="rocm", vram_mb=_cuda_vram_mb(torch))
    if cuda_ok:
        return AcceleratorProbe(device="cuda", vram_mb=_cuda_vram_mb(torch))
    if mps_ok:
        return AcceleratorProbe(device="mps", vram_mb=_mps_vram_mb())
    return _CPU_PROBE


def parse_accelerator_probe_output(stdout: str) -> AcceleratorProbe:
    """Parse the probe child's last JSON line; anything unexpected means CPU."""
    lines = [line for line in stdout.splitlines() if line.strip()]
    if not lines:
        return _CPU_PROBE
    try:
        payload: object = json.loads(lines[-1])
    except json.JSONDecodeError:
        return _CPU_PROBE
    if not isinstance(payload, dict):
        return _CPU_PROBE
    fields = cast(dict[str, object], payload)
    device_raw = fields.get("device")
    vram_raw = fields.get("vramMb")
    if not isinstance(device_raw, str) or not isinstance(vram_raw, int):
        return _CPU_PROBE
    device = _DEVICES_BY_NAME.get(device_raw)
    if device is None:
        return _CPU_PROBE
    return AcceleratorProbe(device=device, vram_mb=max(0, vram_raw))


def _probe_accelerator_out_of_process() -> AcceleratorProbe:
    try:
        completed = subprocess.run(
            [sys.executable, "-c", _PROBE_SCRIPT],
            capture_output=True,
            text=True,
            timeout=_PROBE_TIMEOUT_SEC,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        logger.warning("hardware_probe_failed error=%s", exc)
        return _CPU_PROBE
    if completed.returncode != 0:
        logger.warning(
            "hardware_probe_failed returncode=%s stderr=%s",
            completed.returncode,
            completed.stderr.strip()[-500:],
        )
        return _CPU_PROBE
    return parse_accelerator_probe_output(completed.stdout)


def _probe_accelerator() -> AcceleratorProbe:
    """Detect the accelerator without importing torch into this (long-lived) process.

    torch is several hundred MiB of native code and heap that cannot be unloaded once
    imported. In the API parent that memory would permanently shrink the cgroup
    budget extract admission needs for the pool child, so the probe runs in a
    short-lived child process and only the result is kept.
    """
    if importlib.util.find_spec("torch") is None:
        return _CPU_PROBE
    return _probe_accelerator_out_of_process()


def detect_hardware_capabilities(*, force_refresh: bool = False) -> HardwareCapabilities:
    global _cached  # noqa: PLW0603
    if _cached is not None and not force_refresh:
        return _cached

    probe = _probe_accelerator()
    device: InferenceDevice = probe.device
    vram_mb = probe.vram_mb
    gpu_available = device != "cpu"

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
