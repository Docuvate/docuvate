"""Comparison models A–H (linear / kernel / MLP / algebra / tensor / bispectrum)."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import f1_score
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler

from algebra import BilinearB, geometric_B_d2
from features import (
    build_element_row,
    cross_bispectrum_1d,
    din_fixed_interaction,
    din_learned_interaction,
    geometric_handcrafted,
    layout_signals_from_doc,
    poly_features,
    tensor_algebra_features,
)

ModelKey = Literal["A", "B2", "B3", "C", "D", "E", "F", "G", "H"]


@dataclass
class ModelBundle:
    key: ModelKey
    role_clf: Any
    field_clf: dict[str, Any]
    label_encoder: LabelEncoder
    scaler: StandardScaler
    learned_B: BilinearB | None
    n_features: int
    train_time_s: float
    n_params: int


def _rows_from_doc(doc: dict[str, Any]) -> list[dict[str, Any]]:
    pw, ph = doc["page_w"], doc["page_h"]
    return [build_element_row(e, pw, ph) for e in doc["elements"]]


def featurize_element(
    row: dict[str, Any],
    key: ModelKey,
    B: BilinearB,
    doc_rows: list[dict[str, Any]] | None = None,
    neighbor: dict[str, Any] | None = None,
) -> np.ndarray:
    if key == "A":
        return geometric_handcrafted(row)
    if key == "B2":
        return poly_features(row, 2)
    if key == "B3":
        return poly_features(row, 3)
    if key == "D":
        return geometric_handcrafted(row)  # MLP uses same base dim
    if key == "G":
        return tensor_algebra_features(row, d=2)
    if key == "E" and neighbor is not None:
        return np.concatenate([geometric_handcrafted(row), din_fixed_interaction(row, neighbor, B)])
    if key == "F" and neighbor is not None:
        return np.concatenate([geometric_handcrafted(row), din_learned_interaction(row, neighbor, B)])
    if key == "H" and doc_rows is not None:
        sig = layout_signals_from_doc(doc_rows, row["page_w"], row["page_h"])
        bis = cross_bispectrum_1d(sig)
        return np.concatenate([geometric_handcrafted(row), bis[:32]])
    return geometric_handcrafted(row)


def _nearest_neighbor_row(row: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
    if not rows:
        return row
    cx, cy = row["cx"], row["cy"]
    best = min(rows, key=lambda r: (r["cx"] - cx) ** 2 + (r["cy"] - cy) ** 2)
    return best


def build_xy(
    docs: list[dict[str, Any]],
    key: ModelKey,
    B: BilinearB,
    max_samples: int | None = None,
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    xs, ys, field_names = [], [], []
    for doc in docs:
        rows = _rows_from_doc(doc)
        for row in rows:
            nb = _nearest_neighbor_row(row, [r for r in rows if r is not row])
            x = featurize_element(row, key, B, doc_rows=rows, neighbor=nb)
            xs.append(x)
            ys.append(row["role"])
            field_names.append(row.get("field_name") or "")
    X = np.vstack(xs)
    y = np.array(ys)
    if max_samples and len(y) > max_samples:
        idx = np.random.default_rng(0).choice(len(y), max_samples, replace=False)
        X, y = X[idx], y[idx]
        field_names = [field_names[i] for i in idx]
    return X, y, field_names


def count_params(key: ModelKey, n_features: int, n_classes: int) -> int:
    if key == "D":
        h = 32
        return n_features * h + h * n_classes + h + n_classes
    if key == "C":
        return min(500, n_features * 100)  # bounded support vectors approx
    return n_features * n_classes + n_classes


def train_model(
    train_docs: list[dict[str, Any]],
    key: ModelKey,
    learned_B: BilinearB | None = None,
    seed: int = 42,
) -> ModelBundle:
    B = learned_B or geometric_B_d2()
    t0 = time.perf_counter()
    X, y, fns = build_xy(train_docs, key, B)
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    n_features = X.shape[1]

    if key == "C":
        n_sub = min(800, len(y_enc))
        idx = np.random.default_rng(seed).choice(len(y_enc), n_sub, replace=False)
        role_clf = KernelRidge(alpha=1.0, kernel="rbf", gamma=0.05)
        role_clf.fit(Xs[idx], y_enc[idx])
    elif key == "D":
        role_clf = MLPClassifier(
            hidden_layer_sizes=(32,),
            max_iter=120,
            random_state=seed,
            early_stopping=True,
        )
        role_clf.fit(Xs, y_enc)
    else:
        role_clf = LogisticRegression(
            max_iter=500,
            random_state=seed,
        )
        role_clf.fit(Xs, y_enc)

    field_clf: dict[str, Any] = {}
    field_targets = sorted({fn for fn in fns if fn})
    for fn in field_targets:
        mask = np.array([f == fn for f in fns])
        if mask.sum() < 10:
            continue
        y_bin = (y[mask] == fn.replace("_", "_") if False else y[mask] == {
            "invoice_number": "invoice_number",
            "invoice_date": "invoice_date",
            "vendor": "vendor",
            "total_amount": "total_amount",
        }.get(fn, fn)).astype(int)
        # simpler: role label equals semantic role for fields
        role_for_field = {
            "invoice_number": "invoice_number",
            "invoice_date": "invoice_date",
            "vendor": "vendor",
            "total_amount": "total_amount",
        }
        target_role = role_for_field.get(fn, fn)
        y_bin = (y[mask] == target_role).astype(int)
        if y_bin.sum() == 0 or y_bin.sum() == mask.sum():
            continue
        clf = Ridge(alpha=1.0)
        clf.fit(Xs[mask], y_bin)
        field_clf[fn] = clf

    train_time = time.perf_counter() - t0
    n_params = count_params(key, n_features, len(le.classes_))
    return ModelBundle(key, role_clf, field_clf, le, scaler, learned_B, n_features, train_time, n_params)


def predict_roles(bundle: ModelBundle, docs: list[dict[str, Any]]) -> tuple[list[str], np.ndarray]:
    B = bundle.learned_B or geometric_B_d2()
    preds = []
    latencies = []
    for doc in docs:
        t0 = time.perf_counter()
        rows = _rows_from_doc(doc)
        for row in rows:
            nb = _nearest_neighbor_row(row, [r for r in rows if r is not row])
            x = featurize_element(row, bundle.key, B, doc_rows=rows, neighbor=nb)
            xs = bundle.scaler.transform(x.reshape(1, -1))
            if bundle.key == "C":
                pred = int(np.round(bundle.role_clf.predict(xs)[0]))
                pred = np.clip(pred, 0, len(bundle.label_encoder.classes_) - 1)
            else:
                pred = bundle.role_clf.predict(xs)[0]
            preds.append(bundle.label_encoder.inverse_transform([pred])[0])
        latencies.append(time.perf_counter() - t0)
    return preds, np.array(latencies)


def macro_f1(y_true: list[str], y_pred: list[str]) -> float:
    labels = sorted(set(y_true) | set(y_pred))
    return float(f1_score(y_true, y_pred, labels=labels, average="macro", zero_division=0))
