# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import shutil
import subprocess
import urllib.request
from dataclasses import dataclass

from closed_form_ml.interfaces import ReaderSpan


@dataclass
class OllamaExtractiveReader:
    model: str

    def available(self) -> bool:
        return shutil.which("ollama") is not None

    def answer(self, question: str, context: str) -> ReaderSpan | None:
        if not self.available():
            return None
        prompt = (
            "Extract the shortest answer span from the context. Reply with JSON "
            '{"answer":"..."} only.\n\n'
            f"Question: {question.strip()}\n\nContext:\n{context[:3500]}"
        )
        payload = json.dumps({"model": self.model, "prompt": prompt, "stream": False}).encode()
        req = urllib.request.Request(
            "http://127.0.0.1:11434/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.loads(resp.read().decode())
        except Exception:
            return None
        text = str(body.get("response", "")).strip()
        if "{" in text:
            try:
                parsed = json.loads(text[text.find("{") : text.rfind("}") + 1])
                text = str(parsed.get("answer", text))
            except json.JSONDecodeError:
                pass
        text = text.strip().strip('"')
        if not text:
            return None
        start = context.find(text)
        if start < 0:
            start = 0
        return ReaderSpan(text, 0.5, start, start + len(text))


def ensure_ollama_models(models: list[str]) -> dict[str, bool]:
    if not shutil.which("ollama"):
        return {m: False for m in models}
    subprocess.Popen(  # noqa: S603
        ["ollama", "serve"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    status: dict[str, bool] = {}
    for model in models:
        try:
            subprocess.run(  # noqa: S603
                ["ollama", "pull", model],
                check=True,
                timeout=600,
                capture_output=True,
            )
            status[model] = True
        except (subprocess.SubprocessError, OSError):
            status[model] = False
    return status
