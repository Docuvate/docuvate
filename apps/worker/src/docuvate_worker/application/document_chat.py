from __future__ import annotations

from docuvate_worker.infrastructure.chat.context_qa import answer_from_document_context
from docuvate_worker.infrastructure.chat.donut_vqa import answer_with_donut, donut_available
from docuvate_worker.infrastructure.hardware_capabilities import (
    HEAVY_VISION_MIN_VRAM_MB,
    detect_hardware_capabilities,
)


class DocumentChatError(Exception):
    def __init__(self, message: str, *, configured: bool = False) -> None:
        super().__init__(message)
        self.configured = configured


def chat_on_document(
    *,
    provider: str,
    message: str,
    title: str,
    filename: str,
    text: str,
    fields: list[dict[str, str]],
    raw: bytes | None,
    mime_type: str | None,
) -> tuple[str, bool, str]:
    mode = provider.strip().lower()
    if mode in ("context", "default", "worker"):
        reply = answer_from_document_context(
            message,
            title=title,
            filename=filename,
            text=text,
            fields=fields,
        )
        return reply, True, "context"

    if mode in ("donut", "donut-ml", "donut_ml"):
        if raw is None or not mime_type:
            raise DocumentChatError(
                "Donut benötigt die Dokumentdatei. Speicherobjekt konnte nicht geladen werden.",
                configured=False,
            )
        try:
            reply = answer_with_donut(raw, mime_type, message)
        except RuntimeError as exc:
            raise DocumentChatError(str(exc), configured=False) from exc
        return reply, True, "donut-ml"

    raise DocumentChatError(f"Unbekannter Chat-Provider „{provider}“.", configured=False)


def _donut_description(*, installed: bool, available: bool) -> str:
    hw = detect_hardware_capabilities()
    if not installed:
        return (
            "Visuelle Fragen an die erste Seite (DocVQA). Compose: "
            "WORKER_OPTIONAL_EXTRAS=donut und Worker-Image neu bauen; "
            "lokal: uv sync --extra donut."
        )
    if not hw.gpu_available:
        return (
            "Donut DocVQA benötigt eine GPU (CUDA/MPS/ROCm). "
            "Auf CPU-only Hosts: Ollama mit kleinem GGUF-Modell oder Kontext-RAG."
        )
    if not available:
        return (
            f"Donut DocVQA benötigt eine GPU mit mindestens {HEAVY_VISION_MIN_VRAM_MB} MB VRAM "
            f"(erkannt: {hw.vram_mb} MB auf {hw.device}). "
            "Kleinere Modelle über Ollama auf CPU nutzen."
        )
    return "Visuelle Fragen an die erste Seite (DocVQA) — GPU-Inferenz."


def chat_provider_status() -> list[dict[str, str | bool]]:
    from docuvate_worker.infrastructure.chat.rag_rerank import reranker_status

    rerank = reranker_status()
    donut_installed = False
    try:
        import transformers  # noqa: F401

        donut_installed = True
    except ImportError:
        donut_installed = False
    donut_ok = donut_available()
    rerank_available = bool(rerank.get("available"))
    rerank_reason = str(rerank.get("reason") or "")
    return [
        {
            "id": "rag-reranker",
            "label": "RAG Reranker (cross-encoder)",
            "description": (
                f"ONNX reranker ({rerank.get('model', '')}); "
                + (
                    "bereit."
                    if rerank_available
                    else f"nicht verfügbar: {rerank_reason or 'unbekannt'}."
                )
            ),
            "available": rerank_available,
        },
        {
            "id": "context",
            "label": "Kontext (Embeddings)",
            "description": (
                "CPU-RAG: Embeddings + Top-k-Chunks aus OCR-Text und Feldern (Standard ohne LLM)."
            ),
            "available": True,
        },
        {
            "id": "donut-ml",
            "label": "Donut DocVQA",
            "description": _donut_description(installed=donut_installed, available=donut_ok),
            "available": donut_ok,
        },
    ]
