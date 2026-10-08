import os
from unittest.mock import MagicMock, patch

from docuvate_worker.infrastructure.hardware_capabilities import (
    HEAVY_VISION_MIN_VRAM_MB,
    detect_hardware_capabilities,
)


def _mock_torch(*, cuda: bool = False, mps: bool = False, rocm: bool = False, vram_bytes: int = 0):
    torch = MagicMock()
    torch.cuda.is_available.return_value = cuda
    mps_backend = MagicMock()
    mps_backend.is_available.return_value = mps
    torch.backends.mps = mps_backend
    torch.version.hip = "5.0" if rocm else None
    if cuda and vram_bytes:
        props = MagicMock()
        props.total_memory = vram_bytes
        torch.cuda.get_device_properties.return_value = props
    return torch


def test_cpu_when_no_torch_accelerator() -> None:
    detect_hardware_capabilities(force_refresh=True)
    torch = _mock_torch(cuda=False, mps=False)
    with patch(
        "docuvate_worker.infrastructure.hardware_capabilities._import_torch",
        return_value=torch,
    ):
        report = detect_hardware_capabilities(force_refresh=True)
    assert report.device == "cpu"
    assert report.gpu_available is False
    assert report.heavy_vision is False
    assert report.cpu_rag is True


def test_cuda_heavy_vision_when_enough_vram() -> None:
    vram = (HEAVY_VISION_MIN_VRAM_MB + 512) * 1024 * 1024
    torch = _mock_torch(cuda=True, vram_bytes=vram)
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("DOCUVATE_CUDA_VRAM_MB", None)
        with patch(
            "docuvate_worker.infrastructure.hardware_capabilities._import_torch",
            return_value=torch,
        ):
            report = detect_hardware_capabilities(force_refresh=True)
    assert report.device == "cuda"
    assert report.heavy_vision is True


def test_api_dict_shape() -> None:
    torch = _mock_torch(cuda=False, mps=True)
    with patch.dict(os.environ, {"DOCUVATE_MPS_VRAM_MB": "16384"}, clear=False):
        with patch(
            "docuvate_worker.infrastructure.hardware_capabilities._import_torch",
            return_value=torch,
        ):
            payload = detect_hardware_capabilities(force_refresh=True).as_api_dict()
    assert payload["device"] == "mps"
    assert payload["capabilities"]["cpuRag"] is True
