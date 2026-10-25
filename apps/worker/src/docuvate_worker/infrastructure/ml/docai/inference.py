# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
import re
import time
from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

from docuvate_worker.infrastructure.ml.docai import features as layout_features
from docuvate_worker.infrastructure.ml.docai.paths import docai_model_dir
from docuvate_worker.infrastructure.onnx_e5_encoder import resolve_e5_onnx_dir


class _PcaTransform:
    def __init__(self, mean: np.ndarray, components: np.ndarray) -> None:
        self._mean = mean
        self._components = components

    def transform(self, matrix: np.ndarray) -> np.ndarray:
        return (np.asarray(matrix, np.float32) - self._mean) @ self._components.T


@dataclass(frozen=True)
class DocaiUnit:
    text: str
    box: tuple[float, float, float, float]
    ocr_conf: float = 1.0


@dataclass(frozen=True)
class DocaiFieldPrediction:
    text: str
    box: tuple[float, float, float, float]
    field_type: str
    confidence: float
    confidence_calibrated: float
    status: str


@dataclass(frozen=True)
class DocaiLinkPrediction:
    source_index: int
    target_index: int
    score: float


class DocaiRuntime:
    def __init__(self, *, threads: int = 2) -> None:
        model_dir = docai_model_dir()
        if not model_dir.is_dir():
            msg = f"DocAI model directory missing: {model_dir}"
            raise FileNotFoundError(msg)
        session_options = ort.SessionOptions()
        session_options.intra_op_num_threads = threads
        session_options.inter_op_num_threads = 1

        def _session(path: Path) -> ort.InferenceSession:
            return ort.InferenceSession(
                str(path),
                session_options,
                providers=["CPUExecutionProvider"],
            )

        self._cfg: dict[str, Any] = json.loads((model_dir / "config.json").read_text(encoding="utf-8"))
        arrays = np.load(model_dir / "arrays.npz")
        vocab_payload = json.loads((model_dir / "tfidf_vocab.json").read_text(encoding="utf-8"))
        self._vocab: dict[str, int] = vocab_payload["vocabulary"]
        self._ngram_range: tuple[int, int] = tuple(vocab_payload["ngram_range"])
        self._idf = arrays["idf"]
        self._pca = _PcaTransform(arrays["pca_mean"], arrays["pca_components"])
        self._field_stack = self._cfg.get("field_stack") == "F2"
        self._f2 = _session(model_dir / "f2_head.onnx") if self._field_stack else None
        self._pca_e5 = (
            _PcaTransform(arrays["pcaE_mean"], arrays["pcaE_components"])
            if self._field_stack
            else None
        )
        self._field = _session(model_dir / "field_head.onnx")
        self._rank = _session(model_dir / "link_ranker.onnx")
        e5_dir = resolve_e5_onnx_dir(quantized_for_docai=True)
        self._e5 = _session(e5_dir / "onnx" / "model_quantized.onnx")
        self._e5_inputs = [item.name for item in self._e5.get_inputs()]
        self._tokenizer = Tokenizer.from_file(str(e5_dir / "tokenizer.json"))
        self._tokenizer.enable_truncation(int(self._cfg["e5_maxlen"]))
        self._tokenizer.enable_padding()
        self._classes: list[str] = list(self._cfg["classes"])
        calibration = self._cfg["calibration"]
        self._cal_x = np.array(calibration["x"], dtype=np.float64)
        self._cal_y = np.array(calibration["y"], dtype=np.float64)
        ocr_cfg = self._cfg.get("ocr", {})
        self._use_cls = bool(ocr_cfg.get("use_cls", True))
        self._rapidocr = self._build_ocr(model_dir, ocr_cfg, threads)

    def _build_ocr(self, model_dir: Path, ocr_cfg: dict[str, Any], threads: int) -> Any:
        from rapidocr_onnxruntime import RapidOCR  # noqa: PLC0415

        kwargs: dict[str, Any] = {
            "intra_op_num_threads": threads,
            "inter_op_num_threads": 1,
            "rec_batch_num": 3,
        }
        rec_rel = ocr_cfg.get("rec_model")
        if isinstance(rec_rel, str) and rec_rel.strip():
            kwargs["rec_model_path"] = str(model_dir / rec_rel)
        return RapidOCR(**kwargs)

    def _ngrams(self, text: str) -> list[str]:
        text = re.sub(r"\s\s+", " ", text.lower())
        out: list[str] = []
        n_min, n_max = self._ngram_range
        for word in text.split():
            padded = f" {word} "
            length = len(padded)
            for n in range(n_min, n_max + 1):
                offset = 0
                out.append(padded[offset : offset + n])
                while offset + n < length:
                    offset += 1
                    out.append(padded[offset : offset + n])
                if offset == 0:
                    break
        return out

    def _tfidf(self, texts: Sequence[str]) -> np.ndarray:
        matrix = np.zeros((len(texts), len(self._idf)), dtype=np.float32)
        for row, text in enumerate(texts):
            counts = Counter(g for g in self._ngrams(text) if g in self._vocab)
            for gram, count in counts.items():
                col = self._vocab[gram]
                matrix[row, col] = (1.0 + math.log(count)) * self._idf[col]
            norm = float(np.linalg.norm(matrix[row]))
            if norm:
                matrix[row] /= norm
        return matrix

    def _embed(self, texts: Sequence[str], batch_size: int = 64) -> np.ndarray:
        prefix = str(self._cfg.get("e5_prefix", "query: "))
        chunks: list[np.ndarray] = []
        for start in range(0, len(texts), batch_size):
            batch = [prefix + t for t in texts[start : start + batch_size]]
            encoded = self._tokenizer.encode_batch(batch)
            ids = np.array([entry.ids for entry in encoded], dtype=np.int64)
            mask = np.array([entry.attention_mask for entry in encoded], dtype=np.int64)
            feed: dict[str, np.ndarray] = {"input_ids": ids, "attention_mask": mask}
            if "token_type_ids" in self._e5_inputs:
                feed["token_type_ids"] = np.zeros_like(ids)
            hidden = self._e5.run(None, feed)[0]
            pooled = (hidden * mask[..., None]).sum(axis=1) / mask.sum(axis=1, keepdims=True)
            normalized = pooled / np.linalg.norm(pooled, axis=1, keepdims=True)
            chunks.append(normalized.astype(np.float32))
        if not chunks:
            return np.zeros((0, 384), dtype=np.float32)
        return np.vstack(chunks)

    def _calibrate(self, probabilities: np.ndarray) -> np.ndarray:
        return np.interp(probabilities, self._cal_x, self._cal_y)

    def predict_image(self, image: np.ndarray, *, width: int | None = None, height: int | None = None) -> dict[str, Any]:
        started = time.perf_counter()
        timings: dict[str, float] = {}
        ocr_started = time.perf_counter()
        raw, _ = self._rapidocr(image, use_cls=self._use_cls)
        timings["ocr"] = (time.perf_counter() - ocr_started) * 1e3
        if width is None or height is None:
            height, width = int(image.shape[0]), int(image.shape[1])
        units: list[DocaiUnit] = []
        for quad, text, conf in raw or []:
            cleaned = text.strip()
            if not cleaned:
                continue
            xs = [point[0] for point in quad]
            ys = [point[1] for point in quad]
            units.append(
                DocaiUnit(
                    text=cleaned,
                    box=(min(xs), min(ys), max(xs), max(ys)),
                    ocr_conf=float(conf),
                )
            )
        return self.predict_units(units, width=width, height=height, timings=timings, started=started)

    def predict_units(
        self,
        units: Sequence[DocaiUnit],
        *,
        width: float,
        height: float,
        embeddings: np.ndarray | None = None,
        timings: dict[str, float] | None = None,
        started: float | None = None,
    ) -> dict[str, Any]:
        timings = timings if timings is not None else {}
        started = started if started is not None else time.perf_counter()
        if not units:
            timings["total"] = (time.perf_counter() - started) * 1e3
            return {"fields": [], "links": [], "menu_items": [], "timings_ms": timings}

        embed_started = time.perf_counter()
        unit_dicts = [
            {"text": unit.text, "box": list(unit.box), "ocr_conf": unit.ocr_conf} for unit in units
        ]
        texts = [unit.text for unit in units]
        embeddings_matrix = embeddings if embeddings is not None else self._embed(texts)
        timings["embed"] = (time.perf_counter() - embed_started) * 1e3

        payload: dict[str, Any] = {
            "w": width,
            "h": height,
            "units": unit_dicts,
            "E": embeddings_matrix,
        }
        geom_started = time.perf_counter()
        geometry, rows = layout_features.node_geom(payload)
        dense = (
            np.hstack([geometry, layout_features.node_ctx(payload, geometry, embeddings_matrix, rows)])
            if self._cfg.get("field_ctx")
            else geometry
        )
        field_started = time.perf_counter()
        probabilities = self._field.run(
            None,
            {
                "tfidf": self._tfidf(texts),
                "e5": embeddings_matrix,
                "dense": dense.astype(np.float32),
            },
        )[0]
        if self._field_stack and self._f2 is not None and self._pca_e5 is not None:
            f2_input = np.hstack(
                [
                    self._pca_e5.transform(embeddings_matrix),
                    geometry,
                    layout_features.nbr_feats(payload, probabilities, {}),
                ]
            ).astype(np.float32)
            f2_probs = self._f2.run(None, {"X": f2_input})[1]
            stacked = np.zeros_like(probabilities)
            cols = self._cfg["f2_cols"]
            stacked[:, cols] = f2_probs
            probabilities = stacked
        timings["fields"] = (time.perf_counter() - field_started) * 1e3

        payload["G"] = geometry
        payload["rows"] = rows
        payload["y"] = ["other"] * len(units)
        link_started = time.perf_counter()
        sources, targets = layout_features.cand_sets(
            payload,
            probabilities,
            self._classes,
            self._cfg["src"],
            self._cfg["dst"],
            float(self._cfg["tau"]),
        )
        pair_matrix, pairs = layout_features.pair_feats(
            payload, probabilities, sources, targets, self._pca
        )
        if len(pair_matrix):
            link_scores = self._rank.run(None, {"X": pair_matrix.astype(np.float32)})[1][:, 1]
        else:
            link_scores = np.zeros(0, dtype=np.float32)
        decoded = layout_features.decode([(0, i, j) for i, j in pairs], link_scores, 1, float(self._cfg["theta"]))[
            0
        ]
        timings["links"] = (time.perf_counter() - link_started) * 1e3
        timings["geom"] = (time.perf_counter() - geom_started) * 1e3

        accept_threshold = self._cfg["calibration"]["accept_threshold"].get("0.95")
        confidence = probabilities.max(axis=1)
        calibrated = self._calibrate(confidence)
        fields: list[DocaiFieldPrediction] = []
        for index, unit in enumerate(units):
            field_type = self._classes[int(probabilities[index].argmax())]
            status = "review"
            if (
                accept_threshold is not None
                and field_type not in ("other", "key")
                and float(calibrated[index]) >= float(accept_threshold)
            ):
                status = "accept"
            fields.append(
                DocaiFieldPrediction(
                    text=unit.text,
                    box=unit.box,
                    field_type=field_type,
                    confidence=float(confidence[index]),
                    confidence_calibrated=float(calibrated[index]),
                    status=status,
                )
            )
        links = [
            DocaiLinkPrediction(source_index=i, target_index=j, score=float(score))
            for i, j, score in decoded
        ]
        timings["total"] = (time.perf_counter() - started) * 1e3
        return {
            "fields": fields,
            "links": links,
            "probabilities": probabilities,
            "timings_ms": timings,
            "model_version": self._cfg.get("version"),
        }


_runtime: DocaiRuntime | None = None


def get_docai_runtime() -> DocaiRuntime:
    global _runtime  # noqa: PLW0603
    if _runtime is None:
        threads = int(__import__("os").environ.get("DOCUVATE_DOCAI_THREADS", "2"))
        _runtime = DocaiRuntime(threads=threads)
    return _runtime
