# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.infrastructure.fastembed_model import embed_passages
from docuvate_worker.infrastructure.ml.layout_kv_roles.features import (
    LayoutEntity,
    entity_feature_vector,
    link_feature_vector,
)
from docuvate_worker.infrastructure.ml.layout_kv_roles.model import (
    LayoutKvRoleHeadModel,
    predict_link_probability,
    predict_role,
)
from layout_kv_roles.synthetic_corpus import SyntheticDocument


@dataclass(frozen=True)
class EvalPrediction:
    role_labels: tuple[str, ...]
    role_confidences: tuple[float, ...]
    links: tuple[tuple[int, int], ...]


def _layout_entities(doc: SyntheticDocument, vectors: list[list[float]]) -> list[LayoutEntity]:
    entities: list[LayoutEntity] = []
    for idx, (spec, vector) in enumerate(zip(doc.entities, vectors, strict=True)):
        entities.append(
            LayoutEntity(
                index=idx,
                page=spec.page,
                x=spec.x,
                y=spec.y,
                width=spec.width,
                height=spec.height,
                text=spec.text,
                embedding=tuple(float(v) for v in vector),
            )
        )
    return entities


def predict_links_oracle_roles(
    model: LayoutKvRoleHeadModel,
    doc: SyntheticDocument,
    entities: list[LayoutEntity],
    *,
    apply_link_threshold: bool = True,
) -> tuple[tuple[int, int], ...]:
    keys = [idx for idx, entity in enumerate(doc.entities) if entity.role == "key"]
    values = [idx for idx, entity in enumerate(doc.entities) if entity.role == "value"]
    used_values: set[int] = set()
    links: list[tuple[int, int]] = []
    for key_idx in keys:
        best_value: int | None = None
        best_score = -1.0
        key_entity = entities[key_idx]
        for value_idx in values:
            if value_idx in used_values:
                continue
            score = predict_link_probability(
                model,
                link_feature_vector(key_entity, entities[value_idx]),
            )
            if score > best_score:
                best_score = score
                best_value = value_idx
        if best_value is None:
            continue
        if apply_link_threshold and best_score < model.link_min_confidence:
            continue
        used_values.add(best_value)
        links.append((key_idx, best_value))
    return tuple(links)


def predict_document(
    model: LayoutKvRoleHeadModel,
    doc: SyntheticDocument,
    *,
    apply_link_threshold: bool = True,
) -> EvalPrediction:
    texts = [entity.text for entity in doc.entities]
    vectors = embed_passages(texts)
    entities = _layout_entities(doc, vectors)
    role_labels: list[str] = []
    role_confidences: list[float] = []
    for entity in entities:
        label, confidence = predict_role(model, entity_feature_vector(entity, entities))
        role_labels.append(label)
        role_confidences.append(confidence)
    keys = [
        idx
        for idx, (label, confidence) in enumerate(zip(role_labels, role_confidences, strict=True))
        if label == "key" and confidence >= model.role_min_confidence
    ]
    values = [
        idx
        for idx, (label, confidence) in enumerate(zip(role_labels, role_confidences, strict=True))
        if label == "value" and confidence >= model.role_min_confidence
    ]
    used_values: set[int] = set()
    links: list[tuple[int, int]] = []
    for key_idx in keys:
        best_value: int | None = None
        best_score = -1.0
        key_entity = entities[key_idx]
        for value_idx in values:
            if value_idx in used_values:
                continue
            if entities[value_idx].page != key_entity.page:
                continue
            score = predict_link_probability(
                model,
                link_feature_vector(key_entity, entities[value_idx]),
            )
            if score > best_score:
                best_score = score
                best_value = value_idx
        if best_value is None:
            continue
        if apply_link_threshold and best_score < model.link_min_confidence:
            continue
        used_values.add(best_value)
        links.append((key_idx, best_value))
    return EvalPrediction(
        role_labels=tuple(role_labels),
        role_confidences=tuple(role_confidences),
        links=tuple(links),
    )


def role_accuracy(documents: list[SyntheticDocument], model: LayoutKvRoleHeadModel) -> float:
    correct = 0
    total = 0
    for doc in documents:
        prediction = predict_document(model, doc)
        for idx, entity in enumerate(doc.entities):
            gold = entity.role
            if gold == "other":
                continue
            total += 1
            if prediction.role_labels[idx] == gold:
                correct += 1
    return correct / total if total else 0.0


def _linking_f1_from_pairs(
    documents: list[SyntheticDocument],
    predicted_pairs_fn,
) -> tuple[float, float, float]:
    tp = 0
    fp = 0
    fn = 0
    for doc in documents:
        gold = {pair for pair in doc.links}
        pred = {pair for pair in predicted_pairs_fn(doc)}
        tp += len(gold & pred)
        fp += len(pred - gold)
        fn += len(gold - pred)
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return precision, recall, f1


def linking_f1(
    documents: list[SyntheticDocument],
    model: LayoutKvRoleHeadModel,
    *,
    apply_link_threshold: bool = False,
) -> tuple[float, float, float]:
    return _linking_f1_from_pairs(
        documents,
        lambda doc: predict_document(
            model, doc, apply_link_threshold=apply_link_threshold
        ).links,
    )


def linking_f1_oracle_roles(
    documents: list[SyntheticDocument],
    model: LayoutKvRoleHeadModel,
    *,
    apply_link_threshold: bool = False,
) -> tuple[float, float, float]:
    def _predict(doc: SyntheticDocument) -> tuple[tuple[int, int], ...]:
        texts = [entity.text for entity in doc.entities]
        vectors = embed_passages(texts)
        entities = _layout_entities(doc, vectors)
        return predict_links_oracle_roles(
            model,
            doc,
            entities,
            apply_link_threshold=apply_link_threshold,
        )

    return _linking_f1_from_pairs(documents, _predict)
