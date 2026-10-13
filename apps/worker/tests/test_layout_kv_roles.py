from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.domain.representation.constants import EMBEDDING_DIM
from docuvate_worker.domain.representation.encode import DocumentRepresentation, EncodedUnit
from docuvate_worker.domain.representation.quantize import quantize_vector
from docuvate_worker.domain.representation.units import RepresentationUnit
from docuvate_worker.infrastructure.ml.layout_kv_roles.features import (
    ENTITY_FEATURE_DIM,
    LINK_EXTRA_DIM,
    LayoutEntity,
    entity_feature_vector,
    link_feature_vector,
)
from docuvate_worker.infrastructure.ml.layout_kv_roles.model import (
    LayoutKvRoleHeadModel,
    load_layout_kv_role_head,
    predict_link_probability,
    predict_role,
)
from docuvate_worker.infrastructure.ml.layout_kv_roles.suggestions import layout_kv_field_suggestions


def _zero_entity(index: int, text: str, x: float, y: float) -> LayoutEntity:
    return LayoutEntity(
        index=index,
        page=1,
        x=x,
        y=y,
        width=0.2,
        height=0.02,
        text=text,
        embedding=tuple(0.01 * (idx + 1) for idx in range(EMBEDDING_DIM)),
    )


def test_entity_and_link_feature_dimensions() -> None:
    entities = [
        _zero_entity(0, "Date:", 0.1, 0.1),
        _zero_entity(1, "2026-03-13", 0.35, 0.1),
    ]
    entity_vec = entity_feature_vector(entities[0], entities)
    assert len(entity_vec) == ENTITY_FEATURE_DIM
    link_vec = link_feature_vector(entities[0], entities[1])
    assert len(link_vec) == ENTITY_FEATURE_DIM * 2 + LINK_EXTRA_DIM


def test_tiny_model_predicts_roles_and_links() -> None:
    entities = [
        _zero_entity(0, "Total:", 0.1, 0.2),
        _zero_entity(1, "EUR 10.00", 0.35, 0.2),
    ]
    entity_features = entity_feature_vector(entities[0], entities)
    link_features = link_feature_vector(entities[0], entities[1])
    role_weights = np.zeros((3, ENTITY_FEATURE_DIM + 1), dtype=np.float32)
    role_weights[1, 0] = 2.0
    link_weights = np.zeros((1, ENTITY_FEATURE_DIM * 2 + LINK_EXTRA_DIM + 1), dtype=np.float32)
    link_weights[0, 0] = 2.0
    model = LayoutKvRoleHeadModel(
        version=1,
        encoder_id="intfloat/multilingual-e5-small",
        encoder_revision="test",
        role_weights=role_weights,
        link_weights=link_weights,
        role_min_confidence=0.4,
        link_min_confidence=0.5,
        training_seed=1,
        training_data_manifest=("synthetic",),
    )
    role, role_conf = predict_role(model, entity_features)
    assert role == "key"
    assert role_conf > 0.4
    assert predict_link_probability(model, link_features) > 0.5


def test_layout_kv_suggestions_respect_recognized_keys() -> None:
    blocks = [
        ExtractionBlock(page=1, x=0.1, y=0.1, width=0.15, height=0.02, text="Invoice No:", block_index=0),
        ExtractionBlock(page=1, x=0.35, y=0.1, width=0.2, height=0.02, text="INV-9", block_index=1),
    ]
    units: list[EncodedUnit] = []
    for idx, block in enumerate(blocks):
        vector = [0.0] * EMBEDDING_DIM
        vector[idx] = 1.0
        scale, int8 = quantize_vector(vector)
        units.append(
            EncodedUnit(
                unit=RepresentationUnit(
                    unit_index=idx,
                    kind="paragraph",
                    text=block.text,
                    page=1,
                    x=block.x,
                    y=block.y,
                    width=block.width,
                    height=block.height,
                    char_start=None,
                    char_end=None,
                ),
                scale=scale,
                vector_int8=int8,
                binary=b"",
            )
        )
    representation = DocumentRepresentation(
        encoder_id="intfloat/multilingual-e5-small",
        encoder_revision="test",
        representation_version=1,
        units=tuple(units),
        document_mean_scale=1.0,
        document_mean_int8=int8,
        document_max_scale=1.0,
        document_max_int8=int8,
        document_mean_float=tuple([0.0] * EMBEDDING_DIM),
    )
    artifact_path = Path(__file__).resolve().parents[1] / "src/docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json"
    if not artifact_path.is_file():
        return
    model = load_layout_kv_role_head(artifact_path)
    suggestions = layout_kv_field_suggestions(
        blocks,
        representation,
        model=model,
        recognized_field_keys=frozenset({"invoice_no"}),
    )
    assert all(row.key != "invoice_no" for row in suggestions)


def test_shipped_artifact_matches_manifest_schema() -> None:
    artifact_path = (
        Path(__file__).resolve().parents[1]
        / "src/docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json"
    )
    if not artifact_path.is_file():
        return
    payload = json.loads(artifact_path.read_text(encoding="utf-8"))
    assert payload["version"] == 1
    assert isinstance(payload["training"]["data_manifest"], list)
    assert "FUNSD" not in json.dumps(payload["training"]["data_manifest"])
    assert "XFUND" not in json.dumps(payload["training"]["data_manifest"])
