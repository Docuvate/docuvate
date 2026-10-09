import base64
import os

from fastapi import APIRouter, Header, HTTPException

from docuvate_worker.application.document_chat import (
    DocumentChatError,
    chat_on_document,
    chat_provider_status,
)
from docuvate_worker.application.embedding import embed_texts
from docuvate_worker.application.extract import compare_engines, extract_document
from docuvate_worker.application.retrain import run_retrain_stub
from docuvate_worker.infrastructure.chat.context_qa import retrieve_document_rag_context
from docuvate_worker.infrastructure.extractors.engine_catalog import list_engine_meta
from docuvate_worker.infrastructure.extractors.label_custom_fields import (
    extract_label_custom_fields,
)
from docuvate_worker.infrastructure.hardware_capabilities import detect_hardware_capabilities
from docuvate_worker.infrastructure.ml.registry import resolve_active_model
from docuvate_worker.presentation.schemas import (
    CompareEngineResponse,
    CompareRequest,
    CompareResponse,
    DocumentChatProviderInfo,
    DocumentChatProviderListResponse,
    DocumentChatRagContextRequest,
    DocumentChatRagContextResponse,
    DocumentChatRequest,
    DocumentChatResponse,
    EmbedRequest,
    EmbedResponse,
    EngineInfo,
    EngineListResponse,
    ExtractedField,
    ExtractionBlockModel,
    ExtractRequest,
    ExtractResponse,
    HardwareCapabilitiesResponse,
    HealthResponse,
    LabelFieldsExtractRequest,
    LabelFieldsExtractResponse,
    LayoutRenderHtmlRequest,
    LayoutRenderHtmlResponse,
    LayoutRenderTypstRequest,
    LayoutRenderTypstResponse,
    MlResolvedModelResponse,
    MlRetrainRunRequest,
    MlRetrainRunResponse,
)

router = APIRouter(prefix="/v1")


def _require_worker_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("WORKER_SECRET", "worker-shared-secret")
    if x_worker_secret != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _decode_content(content_base64: str) -> bytes:
    try:
        return base64.b64decode(content_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64") from None


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/settings/hardware", response_model=HardwareCapabilitiesResponse)
def hardware_capabilities(
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> HardwareCapabilitiesResponse:
    _require_worker_secret(x_worker_secret)
    report = detect_hardware_capabilities()
    payload = report.as_api_dict()
    return HardwareCapabilitiesResponse(
        device=str(payload["device"]),
        vram_mb=int(payload["vramMb"]),
        gpu_available=bool(payload["gpuAvailable"]),
        capabilities={k: bool(v) for k, v in dict(payload["capabilities"]).items()},
    )


@router.post("/extract", response_model=ExtractResponse)
def extract(
    body: ExtractRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> ExtractResponse:
    _require_worker_secret(x_worker_secret)
    raw = _decode_content(body.content_base64)

    from docuvate_worker.infrastructure.extractors.registry import ExtractorRegistry

    result = extract_document(raw, body.mime_type, engine=body.engine)
    active = body.engine or ExtractorRegistry().active_engine
    return ExtractResponse(
        text=result.text,
        fields=[
            ExtractedField(key=f.key, value=f.value, confidence=f.confidence) for f in result.fields
        ],
        blocks=[
            ExtractionBlockModel(
                page=b.page,
                x=b.x,
                y=b.y,
                width=b.width,
                height=b.height,
                text=b.text,
                blockIndex=b.block_index if b.block_index is not None else None,
            )
            for b in (result.blocks or [])
        ],
        markdown=result.markdown,
        layout_ir=result.layout_ir,
        engine=active,
    )


@router.post("/extract/label-fields", response_model=LabelFieldsExtractResponse)
def extract_label_fields_route(
    body: LabelFieldsExtractRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LabelFieldsExtractResponse:
    _require_worker_secret(x_worker_secret)
    rows = extract_label_custom_fields(
        body.text,
        tag_name=body.tag_name,
        fields=[
            {"key": f.key, "label": f.label, "field_type": f.field_type}
            for f in body.fields
        ],
    )
    return LabelFieldsExtractResponse(
        fields=[
            ExtractedField(key=f.key, value=f.value, confidence=f.confidence)
            for f in rows
        ]
    )


@router.get("/extract/engines", response_model=EngineListResponse)
def list_extract_engines(
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> EngineListResponse:
    _require_worker_secret(x_worker_secret)
    return EngineListResponse(
        engines=[
            EngineInfo(
                id=m.id,
                label=m.label_de,
                description=m.description_de,
                available=m.available,
                arenaEligible=m.arena_eligible,
            )
            for m in list_engine_meta()
        ]
    )


@router.post("/extract/compare", response_model=CompareResponse)
def extract_compare(
    body: CompareRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> CompareResponse:
    _require_worker_secret(x_worker_secret)
    raw = _decode_content(body.content_base64)

    run = compare_engines(raw, body.mime_type, body.engines, max_pages=body.max_pages)
    return CompareResponse(
        engines=run.engines,
        items=[
            CompareEngineResponse(
                engine=row.engine,
                elapsedMs=row.elapsed_ms,
                error=row.error,
                text=row.result.text if row.result else None,
                charCount=len(row.result.text) if row.result else None,
                blockCount=len(row.result.blocks or []) if row.result else None,
                fields=[
                    ExtractedField(key=f.key, value=f.value, confidence=f.confidence)
                    for f in (row.result.fields if row.result else [])
                ],
            )
            for row in run.items
        ],
    )


@router.get("/document-chat/providers", response_model=DocumentChatProviderListResponse)
def list_document_chat_providers(
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> DocumentChatProviderListResponse:
    _require_worker_secret(x_worker_secret)
    return DocumentChatProviderListResponse(
        providers=[
            DocumentChatProviderInfo(
                id=str(p["id"]),
                label=str(p["label"]),
                description=str(p["description"]),
                available=bool(p["available"]),
            )
            for p in chat_provider_status()
        ]
    )


@router.post("/document-chat/rag-context", response_model=DocumentChatRagContextResponse)
def document_chat_rag_context(
    body: DocumentChatRagContextRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> DocumentChatRagContextResponse:
    _require_worker_secret(x_worker_secret)
    result = retrieve_document_rag_context(
        body.message,
        title=body.title,
        filename=body.filename,
        text=body.text,
        fields=[{"key": f.key, "value": f.value} for f in body.fields],
    )
    return DocumentChatRagContextResponse(context_text=result.context_text, chunks=result.chunks)


@router.post("/document-chat", response_model=DocumentChatResponse)
def document_chat(
    body: DocumentChatRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> DocumentChatResponse:
    _require_worker_secret(x_worker_secret)

    raw: bytes | None = None
    if body.content_base64:
        raw = _decode_content(body.content_base64)

    try:
        reply, configured, provider = chat_on_document(
            provider=body.provider,
            message=body.message,
            title=body.title,
            filename=body.filename,
            text=body.text,
            fields=[{"key": f.key, "value": f.value} for f in body.fields],
            raw=raw,
            mime_type=body.mime_type,
        )
    except DocumentChatError as exc:
        return DocumentChatResponse(
            reply=str(exc),
            configured=exc.configured,
            provider=body.provider,
        )
    except Exception:
        return DocumentChatResponse(
            reply=(
                "Der Dokument-Chat konnte Ihre Frage gerade nicht verarbeiten. "
                "Bitte in Kürze erneut versuchen."
            ),
            configured=False,
            provider=body.provider,
        )

    return DocumentChatResponse(reply=reply, configured=configured, provider=provider)


@router.post("/embed", response_model=EmbedResponse)
def embed(
    body: EmbedRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> EmbedResponse:
    _require_worker_secret(x_worker_secret)
    model, vectors = embed_texts(body.texts)
    return EmbedResponse(model=model, embeddings=vectors)


@router.post("/ml/retrain/run", response_model=MlRetrainRunResponse)
def ml_retrain_run(
    body: MlRetrainRunRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> MlRetrainRunResponse:
    _require_worker_secret(x_worker_secret)
    result = run_retrain_stub(
        job_id=body.job_id,
        family_id=body.family_id,
        correction_count=body.correction_count,
    )
    return MlRetrainRunResponse(
        version_tag=result.version_tag,
        metrics=result.metrics,
        row_count=result.row_count,
        dataset_version=result.dataset_version,
        artifact_uri=result.artifact_uri,
        external_run_id=result.external_run_id,
        notes=result.notes,
    )


@router.post("/layout/render-html", response_model=LayoutRenderHtmlResponse)
def layout_render_html(
    body: LayoutRenderHtmlRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LayoutRenderHtmlResponse:
    _require_worker_secret(x_worker_secret)
    from docuvate_worker.infrastructure.layout.layout_ir_parse import document_from_dict
    from docuvate_worker.infrastructure.layout.render_html import layout_ir_to_html

    wire = body.layout_ir.model_dump()
    try:
        doc = document_from_dict(wire)
        html = layout_ir_to_html(doc)
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    return LayoutRenderHtmlResponse(html=html)


@router.post("/layout/render-typst", response_model=LayoutRenderTypstResponse)
def layout_render_typst(
    body: LayoutRenderTypstRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LayoutRenderTypstResponse:
    _require_worker_secret(x_worker_secret)
    from docuvate_worker.infrastructure.layout.layout_ir_parse import document_from_dict
    from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

    wire = body.layout_ir.model_dump()
    try:
        doc = document_from_dict(wire)
        typst = layout_ir_to_typst(doc)
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    return LayoutRenderTypstResponse(typst=typst)


@router.get("/ml/models/{family_id}/active", response_model=MlResolvedModelResponse)
def ml_active_model(
    family_id: str,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> MlResolvedModelResponse:
    _require_worker_secret(x_worker_secret)
    resolved = resolve_active_model(family_id)
    return MlResolvedModelResponse(
        family_id=resolved.family_id,
        version_tag=resolved.version_tag,
        artifact_uri=resolved.artifact_uri,
        source=resolved.source,
    )
