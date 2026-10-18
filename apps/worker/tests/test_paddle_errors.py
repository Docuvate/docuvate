from docuvate_worker.infrastructure.extractors.paddle_errors import map_paddle_exception


def test_map_batch_norm_cast_error() -> None:
    exc = Exception(
        "InvalidArgumentError: Attribute cast error in Op Kernel Context batch_norm MobileNetV3"
    )
    msg = map_paddle_exception(exc)
    assert "Paddle-OCR konnte" in msg
    assert "CPU" in msg


def test_map_libgl_error() -> None:
    exc = Exception("ImportError: libGL.so.1: cannot open shared object file")
    msg = map_paddle_exception(exc)
    assert "libGL" in msg
