# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Map layout compare domain errors to HTTP responses (stable codes, no exception text)."""

from __future__ import annotations

from typing import NoReturn

from fastapi import HTTPException

from docuvate_worker.infrastructure.layout.layout_compare_errors import (
    CompareErrorCode,
    LayoutCompareError,
)


def raise_layout_compare_http(exc: LayoutCompareError) -> NoReturn:
    code = exc.code.value
    if exc.code == CompareErrorCode.PDF_TOO_LARGE:
        raise HTTPException(status_code=413, detail={"errorCode": code}) from exc
    if exc.code in {
        CompareErrorCode.PAGE_OUT_OF_RANGE,
        CompareErrorCode.TOO_MANY_PAGES,
    }:
        raise HTTPException(status_code=422, detail={"errorCode": code}) from exc
    if exc.code == CompareErrorCode.TIMEOUT:
        raise HTTPException(status_code=504, detail={"errorCode": code}) from exc
    raise HTTPException(status_code=422, detail={"errorCode": code}) from exc
