# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations


def map_paddle_exception(exc: Exception) -> str:
    msg = str(exc)
    lower = msg.lower()

    if "libgl.so" in msg or "libgl " in lower:
        return (
            "PaddleOCR benötigt libGL im Worker-Image. "
            "Bitte Worker neu bauen oder Administrator kontaktieren."
        )

    if (
        "batch_norm" in lower
        or "cast error" in lower
        or "op kernel context" in lower
        or "paddle.jit.save" in lower
        or "mobilenet" in lower
    ):
        return (
            "Paddle-OCR konnte auf der CPU nicht starten (Modell-Inkompatibilität). "
            "Worker-Version prüfen oder Administrator kontaktieren."
        )

    if "out of memory" in lower or "memory" in lower and "alloc" in lower:
        return "Paddle-OCR: nicht genug Arbeitsspeicher für die Erkennung."

    if len(msg) > 280:
        return "Paddle-OCR-Fehler. Details stehen im Worker-Log."
    return msg
