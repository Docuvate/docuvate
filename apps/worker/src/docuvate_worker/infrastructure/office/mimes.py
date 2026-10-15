# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

MIME_PDF = "application/pdf"

OFFICE_BORN_DIGITAL_MIMES: frozenset[str] = frozenset(
    {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-powerpoint",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.presentation",
        "application/rtf",
        "text/rtf",
        "text/csv",
        "text/plain",
        "text/markdown",
        "text/html",
        "message/rfc822",
        "application/vnd.ms-outlook",
    }
)

LEGACY_OFFICE_MIMES: frozenset[str] = frozenset(
    {
        "application/msword",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
    }
)

MIME_TO_EXTENSION: dict[str, str] = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.oasis.opendocument.text": ".odt",
    "application/vnd.oasis.opendocument.spreadsheet": ".ods",
    "application/vnd.oasis.opendocument.presentation": ".odp",
    "application/rtf": ".rtf",
    "text/rtf": ".rtf",
    "text/csv": ".csv",
    "text/plain": ".txt",
    "text/markdown": ".md",
    "text/html": ".html",
    "message/rfc822": ".eml",
    "application/vnd.ms-outlook": ".msg",
}


def normalize_mime(mime_type: str) -> str:
    return mime_type.split(";", maxsplit=1)[0].strip().lower()


def is_office_born_digital_mime(mime_type: str) -> bool:
    return normalize_mime(mime_type) in OFFICE_BORN_DIGITAL_MIMES


def is_pipeline_supported_mime(mime_type: str) -> bool:
    base = normalize_mime(mime_type)
    if base == MIME_PDF or base.startswith("image/"):
        return True
    return base in OFFICE_BORN_DIGITAL_MIMES


def extension_for_mime(mime_type: str) -> str:
    return MIME_TO_EXTENSION.get(normalize_mime(mime_type), ".bin")


def needs_libreoffice_preview(mime_type: str) -> bool:
    base = normalize_mime(mime_type)
    if base == MIME_PDF or base.startswith("image/"):
        return False
    if base == "text/plain":
        return False
    return base in OFFICE_BORN_DIGITAL_MIMES
