from __future__ import annotations

import logging
import os
from typing import Literal

logger = logging.getLogger(__name__)

TorchDeviceKind = Literal["cuda", "mps", "cpu"]

_DEVICE_ENV_KEYS = ("DONUT_INFERENCE_DEVICE", "TORCH_INFERENCE_DEVICE")


def _read_device_override() -> str:
    for key in _DEVICE_ENV_KEYS:
        raw = os.environ.get(key, "").strip().lower()
        if raw:
            return raw
    return ""


def _import_torch():
    import torch

    return torch


def _cuda_available(torch) -> bool:
    return bool(torch.cuda.is_available())


def _mps_available(torch) -> bool:
    backend = getattr(torch.backends, "mps", None)
    if backend is None:
        return False
    return bool(backend.is_available())


def _enable_mps_op_fallback() -> None:
    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")


def resolve_torch_inference_device() -> TorchDeviceKind:
    """Pick torch device: CUDA → MPS → CPU unless overridden via env."""
    override = _read_device_override()
    torch = _import_torch()

    if override in ("", "auto"):
        if _cuda_available(torch):
            return "cuda"
        if _mps_available(torch):
            _enable_mps_op_fallback()
            return "mps"
        return "cpu"

    if override in ("cuda", "gpu"):
        if not _cuda_available(torch):
            raise RuntimeError(
                "DONUT_INFERENCE_DEVICE=cuda, aber CUDA ist nicht verfügbar. "
                "Setzen Sie DONUT_INFERENCE_DEVICE=auto, mps oder cpu."
            )
        return "cuda"

    if override == "mps":
        if not _mps_available(torch):
            raise RuntimeError(
                "DONUT_INFERENCE_DEVICE=mps, aber MPS ist nicht verfügbar "
                "(nur Apple Silicon mit PyTorch MPS). "
                "Setzen Sie DONUT_INFERENCE_DEVICE=auto oder cpu."
            )
        _enable_mps_op_fallback()
        return "mps"

    if override in ("cpu", "-1"):
        return "cpu"

    raise RuntimeError(
        f"Unbekannter Wert für DONUT_INFERENCE_DEVICE/TORCH_INFERENCE_DEVICE: {override!r}. "
        "Erlaubt: auto, cuda, mps, cpu."
    )


def transformers_pipeline_device(kind: TorchDeviceKind) -> int | str:
    """Map logical device to Hugging Face pipeline ``device`` argument."""
    if kind == "cpu":
        return -1
    if kind == "cuda":
        return 0
    return "mps"


def resolve_transformers_pipeline_device() -> tuple[TorchDeviceKind, int | str]:
    kind = resolve_torch_inference_device()
    device = transformers_pipeline_device(kind)
    logger.info("Donut inference device: %s (pipeline device=%s)", kind, device)
    return kind, device
