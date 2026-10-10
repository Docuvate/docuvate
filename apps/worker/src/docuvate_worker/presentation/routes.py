# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import base64
import os

from fastapi import APIRouter, Header, HTTPException

from docuvate_worker.application.document_chat import (
    DocumentChatError,
    chat_on_document,
    chat_provider_status,
)
from docuvate_worker.application.embedding import embed_texts
from docuvate_worker.application.embedding_density import (
    classify_embedding,
    record_correction,
    run_calibration,
    train_from_labeled_examples,
)
from docuvate_worker.application.extract import extract_document
from docuvate_worker.application.retrain import run_retrain_stub
from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload
from docuvate_worker.infrastructure.chat.context_qa import retrieve_document_rag_context
from docuvate_worker.infrastructure.chat.rag_rerank import (
    RERANKER_MODEL,
    RagPassage,
    rerank_passages,
    reranker_status,
)
from docuvate_worker.infrastructure.extractors.compare import run_compare
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
    EmbeddingDensityCalibrateRequest,
    EmbeddingDensityCalibrateResponse,
    EmbeddingDensityClassifyRequest,
    EmbeddingDensityClassifyResponse,
    EmbeddingDensityCorrectionRequest,
    EmbeddingDensityCorrectionResponse,
    EmbeddingDensityStateModel,
    EmbeddingDensityTrainRequest,
    EmbeddingDensityTrainResponse,
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
    LayoutCompareMetricsRequest,
    LayoutCompareMetricsResponse,
    LayoutComparePageMetricModel,
    LayoutComparePageRequest,
    LayoutComparePageResponse,
    LayoutCompareSummaryRequest,
    LayoutCompareSummaryResponse,
    LayoutRenderHtmlRequest,
    LayoutRenderHtmlResponse,
    LayoutRenderTypstRequest,
    LayoutRenderTypstResponse,
    MlResolvedModelResponse,
    MlRetrainRunRequest,
    MlRetrainRunResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
    RagRetrieveResultItem,
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


@router.get("/health/ready", response_model=HealthResponse)
def health_ready() -> HealthResponse:
    status = reranker_status()
    if status.get("available") and not status.get("loaded"):
        from docuvate_worker.infrastructure.chat.rag_rerank import (  # noqa: PLC0415
            ensure_reranker_loaded,
        )

        ensure_reranker_loaded()
        status = reranker_status()
    if not status.get("available"):
        return HealthResponse(status="degraded")
    return HealthResponse(status="ok")


@router.get("/settings/hardware", response_model=HardwareCapabilitiesResponse)
def hardware_capabilities(
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> HardwareCapabilitiesResponse:
    _require_worker_secret(x_worker_secret)
    report = detect_hardware_capabilities()
    payload = report.as_api_dict()
    capabilities_raw = payload["capabilities"]
    capabilities: dict[str, bool] = {}
    if isinstance(capabilities_raw, dict):
        for key, value in capabilities_raw.items():
            capabilities[str(key)] = bool(value)
    return HardwareCapabilitiesResponse(
        device=str(payload["device"]),
        vram_mb=int(payload["vramMb"]) if isinstance(payload["vramMb"], int) else 0,
        gpu_available=bool(payload["gpuAvailable"]),
        capabilities=capabilities,
    )


@router.post("/extract", response_model=ExtractResponse)
def extract(
    body: ExtractRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> ExtractResponse:
    _require_worker_secret(x_worker_secret)
    raw = _decode_content(body.content_base64)

    from docuvate_worker.infrastructure.extractors.registry import (  # noqa: PLC0415
        ExtractorRegistry,
    )

    result = extract_document(raw, body.mime_type, engine=body.engine)
    active = body.engine or ExtractorRegistry().active_engine
    suggestions = result.field_suggestions or []
    return ExtractResponse(
        text=result.text,
        fields=[
            ExtractedField(key=f.key, value=f.value, confidence=f.confidence) for f in result.fields
        ],
        field_suggestions=[
            ExtractedField(key=f.key, value=f.value, confidence=f.confidence) for f in suggestions
        ],
        blocks=[
            ExtractionBlockModel(
                page=b.page,
                x=b.x,
                y=b.y,
                width=b.width,
                height=b.height,
                text=b.text,
                block_index=b.block_index if b.block_index is not None else None,
            )
            for b in (result.blocks or [])
        ],
        markdown=result.markdown,
        layout_ir=result.layout_ir,
        layout_reconstruction_reliable=result.layout_reconstruction_reliable,
        layout_unreliable_reason=result.layout_unreliable_reason,
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
                arena_eligible=m.arena_eligible,
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

    run = run_compare(raw, body.mime_type, body.engines, max_pages=body.max_pages)
    return CompareResponse(
        engines=run.engines,
        items=[
            CompareEngineResponse(
                engine=row.engine,
                elapsed_ms=row.elapsed_ms,
                error=row.error,
                text=row.result.text if row.result else None,
                char_count=len(row.result.text) if row.result else None,
                block_count=len(row.result.blocks or []) if row.result else None,
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


@router.post("/rag/retrieve", response_model=RagRetrieveResponse)
def rag_retrieve(
    body: RagRetrieveRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> RagRetrieveResponse:
    _require_worker_secret(x_worker_secret)
    passages = [RagPassage(id=p.id, text=p.text) for p in body.passages]
    ranked, reranker_used = rerank_passages(body.query, passages, top_k=4)
    return RagRetrieveResponse(
        results=[RagRetrieveResultItem(id=r.id, score=r.score) for r in ranked],
        reranker_used=reranker_used,
        reranker_model=RERANKER_MODEL if reranker_used else None,
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


@router.post("/ml/embedding-density/classify", response_model=EmbeddingDensityClassifyResponse)
def embedding_density_classify(
    body: EmbeddingDensityClassifyRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> EmbeddingDensityClassifyResponse:
    _require_worker_secret(x_worker_secret)
    state = EmbeddingDensityStatePayload.model_validate(body.state.model_dump())
    result = classify_embedding(state, body.vector)
    return EmbeddingDensityClassifyResponse(**result.model_dump())


@router.post("/ml/embedding-density/calibrate", response_model=EmbeddingDensityCalibrateResponse)
def embedding_density_calibrate(
    body: EmbeddingDensityCalibrateRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> EmbeddingDensityCalibrateResponse:
    _require_worker_secret(x_worker_secret)
    state = EmbeddingDensityStatePayload.model_validate(body.state.model_dump())
    if len(body.document_ids) != len(body.label_ids):
        raise HTTPException(
            status_code=400,
            detail="document_ids must match label_ids length for held-out calibration",
        )
    payload = run_calibration(
        state,
        body.vectors,
        body.label_ids,
        delta=body.delta,
        document_ids=body.document_ids,
    )
    calibration_metrics = payload.metrics
    metrics = {
        "coarse_accepted_blocks": (
            calibration_metrics.coarse_accepted_blocks if calibration_metrics else 0.0
        ),
        "fine_labels_calibrated": (
            calibration_metrics.fine_labels_calibrated if calibration_metrics else 0.0
        ),
        "coarse_ready": (
            calibration_metrics.coarse_ready if calibration_metrics else 0.0
        ),
        "fine_ready_labels": (
            calibration_metrics.fine_ready_labels if calibration_metrics else 0.0
        ),
    }
    state_out = EmbeddingDensityStatePayload.model_validate(
        payload.model_dump(exclude={"metrics"})
    )
    return EmbeddingDensityCalibrateResponse(
        state=EmbeddingDensityStateModel(**state_out.model_dump()),
        metrics=metrics,
    )


@router.post("/ml/embedding-density/correct", response_model=EmbeddingDensityCorrectionResponse)
def embedding_density_correct(
    body: EmbeddingDensityCorrectionRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> EmbeddingDensityCorrectionResponse:
    _require_worker_secret(x_worker_secret)
    state = EmbeddingDensityStatePayload.model_validate(body.state.model_dump())
    updated = record_correction(
        state,
        body.vector,
        body.target_label_id,
        strength=body.strength,
    )
    return EmbeddingDensityCorrectionResponse(
        state=EmbeddingDensityStateModel(**updated.model_dump())
    )


@router.post("/ml/embedding-density/train", response_model=EmbeddingDensityTrainResponse)
def embedding_density_train(
    body: EmbeddingDensityTrainRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> EmbeddingDensityTrainResponse:
    _require_worker_secret(x_worker_secret)
    trained = train_from_labeled_examples(
        body.label_ids,
        body.vectors,
        body.example_label_ids,
        body.unlabeled_vectors,
    )
    return EmbeddingDensityTrainResponse(state=EmbeddingDensityStateModel(**trained.model_dump()))


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
    from docuvate_worker.infrastructure.layout.layout_ir_parse import (  # noqa: PLC0415
        document_from_dict,
    )
    from docuvate_worker.infrastructure.layout.render_html import layout_ir_to_html  # noqa: PLC0415

    wire = body.layout_ir.model_dump()
    from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (  # noqa: PLC0415
        assess_layout_reconstruction,
        decode_optional_pdf,
    )

    try:
        doc = document_from_dict(wire)
        html = layout_ir_to_html(doc)
        fidelity = assess_layout_reconstruction(
            doc,
            decode_optional_pdf(body.original_pdf_base64),
            fixture_id="render",
            category="born_digital_standard",
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    return LayoutRenderHtmlResponse(
        html=html,
        reconstruction_reliable=fidelity.reconstruction_reliable,
        unreliable_reason=(
            fidelity.unreliable_reason.value if fidelity.unreliable_reason else None
        ),
    )


@router.post("/layout/render-typst", response_model=LayoutRenderTypstResponse)
def layout_render_typst(
    body: LayoutRenderTypstRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LayoutRenderTypstResponse:
    _require_worker_secret(x_worker_secret)
    from docuvate_worker.infrastructure.layout.layout_ir_parse import (  # noqa: PLC0415
        document_from_dict,
    )
    from docuvate_worker.infrastructure.layout.typst_export import (  # noqa: PLC0415
        layout_ir_to_typst_for_mode,
    )
    from docuvate_worker.infrastructure.layout.typst_export_mode import (  # noqa: PLC0415
        parse_typst_export_mode,
    )

    wire = body.layout_ir.model_dump()
    from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (  # noqa: PLC0415
        assess_layout_reconstruction,
        decode_optional_pdf,
    )

    try:
        doc = document_from_dict(wire)
        export_mode = parse_typst_export_mode(body.mode)
        typst = layout_ir_to_typst_for_mode(doc, export_mode)
        fidelity = assess_layout_reconstruction(
            doc,
            decode_optional_pdf(body.original_pdf_base64),
            fixture_id="render",
            category="born_digital_standard",
        )
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    return LayoutRenderTypstResponse(
        typst=typst,
        reconstruction_reliable=fidelity.reconstruction_reliable,
        unreliable_reason=(
            fidelity.unreliable_reason.value if fidelity.unreliable_reason else None
        ),
    )


@router.post("/layout/compare-summary", response_model=LayoutCompareSummaryResponse)
def layout_compare_summary(
    body: LayoutCompareSummaryRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LayoutCompareSummaryResponse:
    _require_worker_secret(x_worker_secret)
    from docuvate_worker.infrastructure.layout.layout_compare_errors import (  # noqa: PLC0415
        LayoutCompareError,
    )
    from docuvate_worker.infrastructure.layout.layout_compare_executor import (  # noqa: PLC0415
        run_layout_compare,
    )
    from docuvate_worker.infrastructure.layout.layout_ir_parse import (  # noqa: PLC0415
        document_from_dict,
    )
    from docuvate_worker.infrastructure.layout.layout_page_compare import (  # noqa: PLC0415
        layout_compare_summary as summary,
    )
    from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (  # noqa: PLC0415
        decode_optional_pdf,
    )
    from docuvate_worker.presentation.layout_compare_http import (  # noqa: PLC0415
        raise_layout_compare_http,
    )

    original = decode_optional_pdf(body.original_pdf_base64)
    if original is None:
        raise HTTPException(status_code=422, detail="Invalid original PDF payload")
    try:
        doc = document_from_dict(body.layout_ir.model_dump())
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    try:
        result = run_layout_compare(lambda: summary(original, doc))
    except LayoutCompareError as exc:
        raise_layout_compare_http(exc)
    return LayoutCompareSummaryResponse(
        category=result.category,
        ssim_floor=result.ssim_floor,
        page_count=result.page_count,
    )


@router.post("/layout/compare-metrics", response_model=LayoutCompareMetricsResponse)
def layout_compare_metrics(
    body: LayoutCompareMetricsRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LayoutCompareMetricsResponse:
    _require_worker_secret(x_worker_secret)
    from docuvate_worker.infrastructure.layout.layout_compare_errors import (  # noqa: PLC0415
        LayoutCompareError,
    )
    from docuvate_worker.infrastructure.layout.layout_compare_executor import (  # noqa: PLC0415
        run_layout_compare,
    )
    from docuvate_worker.infrastructure.layout.layout_ir_parse import (  # noqa: PLC0415
        document_from_dict,
    )
    from docuvate_worker.infrastructure.layout.layout_page_compare import (  # noqa: PLC0415
        collect_layout_compare_metrics_for_pages,
    )
    from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (  # noqa: PLC0415
        decode_optional_pdf,
    )
    from docuvate_worker.presentation.layout_compare_http import (  # noqa: PLC0415
        raise_layout_compare_http,
    )

    original = decode_optional_pdf(body.original_pdf_base64)
    if original is None:
        raise HTTPException(status_code=422, detail="Invalid original PDF payload")
    try:
        doc = document_from_dict(body.layout_ir.model_dump())
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    try:
        metrics = run_layout_compare(
            lambda: collect_layout_compare_metrics_for_pages(
                original,
                doc,
                body.page_numbers,
                dpi=body.dpi,
            )
        )
    except LayoutCompareError as exc:
        raise_layout_compare_http(exc)
    return LayoutCompareMetricsResponse(
        category=metrics.category,
        ssim_floor=metrics.ssim_floor,
        page_count=metrics.page_count,
        pages=[
            LayoutComparePageMetricModel(
                page_number=row.page_number,
                ssim=row.ssim,
                ink_deviation=row.ink_deviation,
                page_reliable=row.page_reliable,
                error_code=row.error_code,
            )
            for row in metrics.pages
        ],
    )


@router.post("/layout/compare-page", response_model=LayoutComparePageResponse)
def layout_compare_page(
    body: LayoutComparePageRequest,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> LayoutComparePageResponse:
    _require_worker_secret(x_worker_secret)
    from docuvate_worker.infrastructure.layout.layout_compare_errors import (  # noqa: PLC0415
        LayoutCompareError,
    )
    from docuvate_worker.infrastructure.layout.layout_compare_executor import (  # noqa: PLC0415
        run_layout_compare,
    )
    from docuvate_worker.infrastructure.layout.layout_ir_parse import (  # noqa: PLC0415
        document_from_dict,
    )
    from docuvate_worker.infrastructure.layout.layout_page_compare import (  # noqa: PLC0415
        compare_layout_page,
    )
    from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (  # noqa: PLC0415
        decode_optional_pdf,
    )
    from docuvate_worker.presentation.layout_compare_http import (  # noqa: PLC0415
        raise_layout_compare_http,
    )

    original = decode_optional_pdf(body.original_pdf_base64)
    if original is None:
        raise HTTPException(status_code=422, detail="Invalid original PDF payload")
    try:
        doc = document_from_dict(body.layout_ir.model_dump())
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Invalid layout IR document") from exc
    try:
        payload = run_layout_compare(
            lambda: compare_layout_page(
                original,
                doc,
                page_number=body.page_number,
                dpi=body.dpi,
                include_heatmap=body.include_heatmap,
            )
        )
    except LayoutCompareError as exc:
        raise_layout_compare_http(exc)
    return LayoutComparePageResponse(
        page_number=payload.page_number,
        ssim=payload.ssim,
        ink_deviation=payload.ink_deviation,
        ssim_floor=payload.ssim_floor,
        page_reliable=payload.page_reliable,
        width_px=payload.width_px,
        height_px=payload.height_px,
        original_png_base64=payload.original_png_base64,
        reconstruction_png_base64=payload.reconstruction_png_base64,
        heatmap_png_base64=payload.heatmap_png_base64,
        error_code=payload.error_code,
    )


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
