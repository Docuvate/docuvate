# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from typing import Protocol

import numpy as np
from numpy.typing import NDArray

OcrQuad = list[list[float]]
OcrImage = NDArray[np.uint8]
OcrLine = tuple[OcrQuad, str, float]
OcrResult = list[OcrLine] | None


class RapidOcrEngine(Protocol):
    def __call__(
        self,
        image: OcrImage,
        *,
        use_cls: bool = False,
    ) -> tuple[OcrResult, object]:
        ...
