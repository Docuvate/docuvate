# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from typing import Any, Protocol, TypedDict

type JsonObject = dict[str, Any]


class PdfPlumberChar(TypedDict, total=False):
    text: str
    x0: float | int | str
    x1: float | int | str
    top: float | int | str
    bottom: float | int | str
    size: float | int | str
    fontname: str
    matrix: tuple[float, ...] | list[float]
    upright: bool | int
    non_stroking_color: object
    stroking_color: object


type PdfCharDict = PdfPlumberChar


class PdfPlumberPage(Protocol):
    chars: list[PdfPlumberChar] | None
    width: float
    height: float

    def extract_words(self, *args: object, **kwargs: object) -> list[JsonObject]: ...

    def find_tables(self, *args: object, **kwargs: object) -> list[object]: ...

    def crop(self, *args: object, **kwargs: object) -> PdfPlumberPage: ...
