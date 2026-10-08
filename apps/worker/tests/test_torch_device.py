import os
from unittest.mock import MagicMock, patch

import pytest

from docuvate_worker.infrastructure.torch_device import (
    resolve_torch_inference_device,
    transformers_pipeline_device,
)


def _mock_torch(*, cuda: bool = False, mps: bool = False) -> MagicMock:
    torch = MagicMock()
    torch.cuda.is_available.return_value = cuda
    mps_backend = MagicMock()
    mps_backend.is_available.return_value = mps
    torch.backends.mps = mps_backend
    return torch


def test_auto_cuda_first() -> None:
    torch = _mock_torch(cuda=True, mps=True)
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("DONUT_INFERENCE_DEVICE", None)
        os.environ.pop("TORCH_INFERENCE_DEVICE", None)
        with patch(
            "docuvate_worker.infrastructure.torch_device._import_torch",
            return_value=torch,
        ):
            assert resolve_torch_inference_device() == "cuda"


def test_auto_mps_when_no_cuda() -> None:
    torch = _mock_torch(cuda=False, mps=True)
    with patch.dict(os.environ, {"DONUT_INFERENCE_DEVICE": "auto"}, clear=False):
        with patch(
            "docuvate_worker.infrastructure.torch_device._import_torch",
            return_value=torch,
        ):
            assert resolve_torch_inference_device() == "mps"
            assert os.environ.get("PYTORCH_ENABLE_MPS_FALLBACK") == "1"


def test_auto_cpu_when_no_accelerator() -> None:
    torch = _mock_torch(cuda=False, mps=False)
    with patch.dict(os.environ, {}, clear=False):
        os.environ.pop("DONUT_INFERENCE_DEVICE", None)
        with patch(
            "docuvate_worker.infrastructure.torch_device._import_torch",
            return_value=torch,
        ):
            assert resolve_torch_inference_device() == "cpu"


def test_explicit_cpu() -> None:
    torch = _mock_torch(cuda=True, mps=True)
    with patch.dict(os.environ, {"TORCH_INFERENCE_DEVICE": "cpu"}, clear=False):
        with patch(
            "docuvate_worker.infrastructure.torch_device._import_torch",
            return_value=torch,
        ):
            assert resolve_torch_inference_device() == "cpu"


def test_explicit_mps_unavailable_raises() -> None:
    torch = _mock_torch(cuda=False, mps=False)
    with patch.dict(os.environ, {"DONUT_INFERENCE_DEVICE": "mps"}, clear=False):
        with patch(
            "docuvate_worker.infrastructure.torch_device._import_torch",
            return_value=torch,
        ):
            with pytest.raises(RuntimeError, match="MPS"):
                resolve_torch_inference_device()


@pytest.mark.parametrize(
    ("kind", "expected"),
    [
        ("cpu", -1),
        ("cuda", 0),
        ("mps", "mps"),
    ],
)
def test_transformers_pipeline_device_mapping(kind, expected) -> None:
    assert transformers_pipeline_device(kind) == expected
