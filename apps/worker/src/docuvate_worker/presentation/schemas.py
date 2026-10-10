# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExtractRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mime_type: str = Field(alias="mime_type")
    content_base64: str
    engine: str | None = None


class CompareRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    mime_type: str = Field(alias="mime_type")
    content_base64: str
    engines: list[str] = Field(default_factory=list)
    max_pages: int | None = Field(default=3, alias="max_pages", ge=1, le=50)


class ExtractedField(BaseModel):
    key: str
    value: str
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class ExtractionBlockModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page: int = Field(ge=1)
    x: float = Field(ge=0.0, le=1.0)
    y: float = Field(ge=0.0, le=1.0)
    width: float = Field(ge=0.0, le=1.0)
    height: float = Field(ge=0.0, le=1.0)
    text: str
    block_index: int | None = Field(default=None, alias="blockIndex")


class ExtractResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    text: str
    fields: list[ExtractedField]
    field_suggestions: list[ExtractedField] = Field(default_factory=list, alias="fieldSuggestions")
    blocks: list[ExtractionBlockModel] = Field(default_factory=list)
    markdown: str | None = None
    layout_ir: dict[str, object] | None = Field(default=None, alias="layoutIr")
    layout_reconstruction_reliable: bool | None = Field(
        default=None, alias="layoutReconstructionReliable"
    )
    layout_unreliable_reason: str | None = Field(default=None, alias="layoutUnreliableReason")
    engine: str | None = None


class EngineInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    id: str
    label: str
    description: str
    available: bool = True
    arena_eligible: bool = Field(default=True, alias="arenaEligible")


class EngineListResponse(BaseModel):
    engines: list[EngineInfo]


class CompareEngineResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    engine: str
    elapsed_ms: int = Field(alias="elapsedMs", ge=0)
    error: str | None = None
    text: str | None = None
    char_count: int | None = Field(default=None, alias="charCount", ge=0)
    block_count: int | None = Field(default=None, alias="blockCount", ge=0)
    fields: list[ExtractedField] = Field(default_factory=list)


class CompareResponse(BaseModel):
    engines: list[str]
    items: list[CompareEngineResponse]


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=32)


class EmbedResponse(BaseModel):
    model: str
    embeddings: list[list[float]]


class HealthResponse(BaseModel):
    status: str


class HardwareCapabilitiesResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    device: str
    vram_mb: int = Field(alias="vramMb", ge=0)
    gpu_available: bool = Field(alias="gpuAvailable")
    capabilities: dict[str, bool]


class MlRetrainRunRequest(BaseModel):
    job_id: str
    family_id: str
    correction_count: int = 0


class MlRetrainRunResponse(BaseModel):
    version_tag: str
    metrics: dict[str, float]
    row_count: int
    dataset_version: str
    artifact_uri: str | None = None
    external_run_id: str | None = None
    notes: str


class MlResolvedModelResponse(BaseModel):
    family_id: str
    version_tag: str
    artifact_uri: str | None = None
    source: str


class DocumentChatField(BaseModel):
    key: str
    value: str


class DocumentChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str = "context"
    message: str
    title: str = ""
    filename: str = ""
    text: str = ""
    fields: list[DocumentChatField] = Field(default_factory=list)
    mime_type: str | None = Field(default=None, alias="mime_type")
    content_base64: str | None = None


class DocumentChatResponse(BaseModel):
    reply: str
    configured: bool
    provider: str


class DocumentChatRagContextRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str
    title: str = ""
    filename: str = ""
    text: str = ""
    fields: list[DocumentChatField] = Field(default_factory=list)


class DocumentChatRagContextResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, ser_json_by_alias=True)

    context_text: str = Field(alias="contextText")
    chunks: list[str] = Field(default_factory=list)


class RagRetrievePassage(BaseModel):
    id: str
    text: str


class RagRetrieveRequest(BaseModel):
    query: str
    passages: list[RagRetrievePassage] = Field(default_factory=list)


class RagRetrieveResultItem(BaseModel):
    id: str
    score: float


class RagRetrieveResponse(BaseModel):
    results: list[RagRetrieveResultItem] = Field(default_factory=list)
    reranker_used: bool = False
    reranker_model: str | None = None


class DocumentChatProviderInfo(BaseModel):
    id: str
    label: str
    description: str
    available: bool


class DocumentChatProviderListResponse(BaseModel):
    providers: list[DocumentChatProviderInfo]


class LabelFieldSpec(BaseModel):
    key: str
    label: str
    field_type: str = Field(default="text", alias="field_type")


class LabelFieldsExtractRequest(BaseModel):
    text: str
    tag_name: str = Field(alias="tag_name")
    fields: list[LabelFieldSpec] = Field(default_factory=list)


class LabelFieldsExtractResponse(BaseModel):
    fields: list[ExtractedField] = Field(default_factory=list)


class LayoutIrWireModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    version: int = Field(ge=1, le=1)
    pages: list[dict[str, object]] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def _element_bounds(self) -> Self:
        from docuvate_worker.infrastructure.layout.layout_ir_limits import (
            MAX_LAYOUT_BLOCKS,
            MAX_LAYOUT_ELEMENTS,
            MAX_LAYOUT_LINES,
            MAX_LAYOUT_TABLES,
            MAX_LAYOUT_VECTORS,
            MAX_LAYOUT_WIDGETS,
        )

        blocks = lines = tables = vectors = widgets = 0
        for p in self.pages:
            if isinstance(p.get("blocks"), list):
                blocks += len(p["blocks"])
            if isinstance(p.get("lines"), list):
                lines += len(p["lines"])
            if isinstance(p.get("tables"), list):
                tables += len(p["tables"])
            if isinstance(p.get("vectors"), list):
                vectors += len(p["vectors"])
            if isinstance(p.get("widgets"), list):
                widgets += len(p["widgets"])
        total = blocks + lines + tables + vectors + widgets
        if blocks > MAX_LAYOUT_BLOCKS:
            raise ValueError("Too many layout blocks")
        if lines > MAX_LAYOUT_LINES:
            raise ValueError("Too many layout lines")
        if tables > MAX_LAYOUT_TABLES:
            raise ValueError("Too many layout tables")
        if vectors > MAX_LAYOUT_VECTORS:
            raise ValueError("Too many layout vectors")
        if widgets > MAX_LAYOUT_WIDGETS:
            raise ValueError("Too many layout widgets")
        if total > MAX_LAYOUT_ELEMENTS:
            raise ValueError("Too many layout elements")
        return self


class LayoutRenderHtmlRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    layout_ir: LayoutIrWireModel = Field(alias="layoutIr")
    original_pdf_base64: str | None = Field(default=None, alias="originalPdfBase64")


class LayoutRenderHtmlResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    html: str
    reconstruction_reliable: bool = Field(default=True, alias="reconstructionReliable")
    unreliable_reason: str | None = Field(default=None, alias="unreliableReason")


class LayoutRenderTypstRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    layout_ir: LayoutIrWireModel = Field(alias="layoutIr")
    original_pdf_base64: str | None = Field(default=None, alias="originalPdfBase64")
    mode: str = Field(default="exakt", description="exakt | semantisch")


class LayoutRenderTypstResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    typst: str
    reconstruction_reliable: bool = Field(default=True, alias="reconstructionReliable")
    unreliable_reason: str | None = Field(default=None, alias="unreliableReason")


class LayoutCompareSummaryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    layout_ir: LayoutIrWireModel = Field(alias="layoutIr")
    original_pdf_base64: str = Field(alias="originalPdfBase64")


class LayoutCompareSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    category: str
    ssim_floor: float = Field(alias="ssimFloor")
    page_count: int = Field(alias="pageCount")


class LayoutCompareMetricsRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    layout_ir: LayoutIrWireModel = Field(alias="layoutIr")
    original_pdf_base64: str = Field(alias="originalPdfBase64")
    page_numbers: list[int] = Field(alias="pageNumbers", min_length=1)
    dpi: int = Field(default=100, ge=72, le=200)


class LayoutComparePageMetricModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page_number: int = Field(alias="pageNumber")
    ssim: float | None = None
    ink_deviation: float | None = Field(default=None, alias="inkDeviation")
    page_reliable: bool = Field(alias="pageReliable")
    error_code: str | None = Field(default=None, alias="errorCode")


class LayoutCompareMetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    category: str
    ssim_floor: float = Field(alias="ssimFloor")
    page_count: int = Field(alias="pageCount")
    pages: list[LayoutComparePageMetricModel]


class LayoutComparePageRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    layout_ir: LayoutIrWireModel = Field(alias="layoutIr")
    original_pdf_base64: str = Field(alias="originalPdfBase64")
    page_number: int = Field(alias="pageNumber", ge=1)
    dpi: int = Field(default=100, ge=72, le=200)
    include_heatmap: bool = Field(default=False, alias="includeHeatmap")


class LayoutComparePageResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page_number: int = Field(alias="pageNumber")
    ssim: float | None = None
    ink_deviation: float | None = Field(default=None, alias="inkDeviation")
    ssim_floor: float = Field(alias="ssimFloor")
    page_reliable: bool = Field(alias="pageReliable")
    width_px: int = Field(alias="widthPx")
    height_px: int = Field(alias="heightPx")
    original_png_base64: str = Field(alias="originalPngBase64")
    reconstruction_png_base64: str = Field(alias="reconstructionPngBase64")
    heatmap_png_base64: str | None = Field(default=None, alias="heatmapPngBase64")
    error_code: str | None = Field(default=None, alias="errorCode")
