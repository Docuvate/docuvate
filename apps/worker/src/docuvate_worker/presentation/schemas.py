from pydantic import BaseModel, ConfigDict, Field


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
    text: str
    fields: list[ExtractedField]
    blocks: list[ExtractionBlockModel] = Field(default_factory=list)
    markdown: str | None = None
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
