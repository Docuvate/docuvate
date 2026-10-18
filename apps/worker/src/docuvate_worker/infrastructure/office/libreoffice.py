# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from docuvate_worker.infrastructure.office.mimes import extension_for_mime, normalize_mime

logger = logging.getLogger(__name__)

_SOFFICE_CANDIDATES = ("soffice", "libreoffice")


def _find_soffice() -> str | None:
    for name in _SOFFICE_CANDIDATES:
        path = shutil.which(name)
        if path:
            return path
    return None


def convert_bytes_to_pdf(
    content: bytes, mime_type: str, *, filename_hint: str | None = None
) -> bytes | None:
    """Convert office/text payloads to PDF using headless LibreOffice."""
    soffice = _find_soffice()
    if soffice is None:
        logger.warning("libreoffice_unavailable preview skipped mime=%s", mime_type)
        return None
    ext = extension_for_mime(mime_type)
    if filename_hint and "." in filename_hint:
        ext = Path(filename_hint).suffix or ext
    with tempfile.TemporaryDirectory(prefix="docuvate-lo-") as tmp:
        src = Path(tmp) / f"input{ext}"
        out_dir = Path(tmp) / "out"
        out_dir.mkdir()
        src.write_bytes(content)
        env = os.environ.copy()
        env.setdefault("HOME", "/tmp")
        try:
            subprocess.run(
                [
                    soffice,
                    "--headless",
                    "--nologo",
                    "--nofirststartwizard",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    str(out_dir),
                    str(src),
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=120,
                env=env,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            logger.warning(
                "libreoffice_convert_failed mime=%s err=%s",
                normalize_mime(mime_type),
                type(exc).__name__,
            )
            return None
        pdf_path = out_dir / f"{src.stem}.pdf"
        if not pdf_path.is_file():
            pdfs = list(out_dir.glob("*.pdf"))
            if not pdfs:
                return None
            pdf_path = pdfs[0]
        data = pdf_path.read_bytes()
        return data if len(data) > 100 else None
