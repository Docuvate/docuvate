"""Document element features: geometry, algebra products, polynomials, bispectrum hooks."""

from __future__ import annotations

from typing import Any

import numpy as np

from algebra import (
    AlgebraElement,
    BilinearB,
    geometric_B_d2,
    learn_B_ridge,
    mul,
    translate_u,
)
from tensor_algebra import TruncatedTensor, encode_position, mul_trunc, feature_dim


def pairwise_diff_centers(boxes: np.ndarray) -> np.ndarray:
    """boxes: (n, 4) x0,y0,x1,y1 -> centers (n,2)."""
    cx = (boxes[:, 0] + boxes[:, 2]) * 0.5
    cy = (boxes[:, 1] + boxes[:, 3]) * 0.5
    return np.stack([cx, cy], axis=1)


def normalize_page_coords(centers: np.ndarray, page_w: float, page_h: float) -> np.ndarray:
    return np.stack([centers[:, 0] / page_w, centers[:, 1] / page_h], axis=1)


def geometric_handcrafted(row: dict[str, Any]) -> np.ndarray:
    """Model A: hand-built geometry + simple text stats."""
    cx, cy = row["cx"], row["cy"]
    w, h = row["bw"], row["bh"]
    page_w, page_h = row["page_w"], row["page_h"]
    rel = np.array(
        [
            cx / page_w,
            cy / page_h,
            w / page_w,
            h / page_h,
            np.log1p(row["char_count"]),
            np.log1p(row["word_count"]),
            row["is_bold"],
            row["font_size_norm"],
            row["ocr_confidence"],
        ],
        dtype=np.float64,
    )
    return rel


def poly_features(row: dict[str, Any], degree: int) -> np.ndarray:
    """Model B: polynomial of normalized (x,y, log chars, aspect)."""
    x = row["cx"] / row["page_w"]
    y = row["cy"] / row["page_h"]
    asp = row["bw"] / max(row["bh"], 1e-6)
    lc = np.log1p(row["char_count"])
    base = np.array([1.0, x, y, asp, lc], dtype=np.float64)
    feats = [base]
    if degree >= 2:
        feats.append(np.outer(base, base).ravel())
    if degree >= 3:
        feats.append(np.outer(base, np.outer(base, base).ravel()).ravel())
    return np.concatenate(feats)


def din_fixed_interaction(elem_i: dict[str, Any], elem_j: dict[str, Any], B: BilinearB) -> np.ndarray:
    """Model E: fixed B interaction features between pair (i,j)."""
    ui = np.array([elem_i["cx"] / elem_i["page_w"], elem_i["cy"] / elem_i["page_h"]])
    uj = np.array([elem_j["cx"] / elem_j["page_w"], elem_j["cy"] / elem_j["page_h"]])
    ei = AlgebraElement(1.0, ui, np.zeros(B.m))
    ej = AlgebraElement(1.0, uj, np.zeros(B.m))
    prod = mul(ei, ej, B)
    return np.concatenate([[prod.a], prod.u, prod.t])


def din_learned_interaction(
    elem_i: dict[str, Any],
    elem_j: dict[str, Any],
    B: BilinearB,
) -> np.ndarray:
    """Model F: same as E but B learned (passed in)."""
    return din_fixed_interaction(elem_i, elem_j, B)


def tensor_algebra_features(row: dict[str, Any], d: int = 2) -> np.ndarray:
    """Model G: truncated tensor encoding of position."""
    x = row["cx"] / row["page_w"]
    y = row["cy"] / row["page_h"]
    t = encode_position(x, y, d=d)
    return t.to_vector(d)


def accumulate_tensor_chain(rows: list[dict[str, Any]], d: int = 2) -> np.ndarray:
    """Ordered product of position encodings (reading order)."""
    acc = encode_position(1.0, 0.0, d=d)  # neutral start
    acc.g0 = 1.0
    for r in rows:
        x = r["cx"] / r["page_w"]
        y = r["cy"] / r["page_h"]
        acc = mul_trunc(acc, encode_position(x, y, d=d), d)
    return acc.to_vector(d)


def cross_bispectrum_1d(
    signals: list[np.ndarray],
    n_freq: int = 16,
) -> np.ndarray:
    """
    Model H (lightweight): triples (a,b,c) of 1D layout signals;
    B_abc(w1,w2) = F_a(w1) F_b(w2) conj(F_c(w1+w2)), averaged over grid.
    """
    if len(signals) < 3:
        return np.zeros(n_freq * n_freq * 3, dtype=np.float64)
    a, b, c = signals[:3]
    n = min(len(a), len(b), len(c), 64)
    a, b, c = a[:n], b[:n], c[:n]
    Fa, Fb, Fc = np.fft.fft(a), np.fft.fft(b), np.fft.fft(c)
    w1 = np.linspace(0, n // 2, n_freq, dtype=int)
    w2 = np.linspace(0, n // 2, n_freq, dtype=int)
    vals = []
    for i in w1:
        for j in w2:
            k = (i + j) % n
            vals.append(Fa[i] * Fb[j] * np.conj(Fc[k]))
    spec = np.array(vals, dtype=np.complex128)
    return np.concatenate([spec.real, spec.imag, np.abs(spec)])


def layout_signals_from_doc(elements: list[dict[str, Any]], page_w: float, page_h: float) -> list[np.ndarray]:
    """1D projections: x-order centers, y-order, font sizes."""
    if not elements:
        return [np.zeros(8), np.zeros(8), np.zeros(8)]
    xs = sorted((e["cx"] / page_w for e in elements))
    ys = sorted((e["cy"] / page_h for e in elements))
    fs = sorted((e.get("font_size_norm", 0.1) for e in elements))
    pad = lambda arr: np.array(arr[:32] + [0.0] * max(0, 32 - len(arr)))
    return [pad(xs), pad(ys), pad(fs)]


def build_element_row(
    elem: dict[str, Any],
    page_w: float,
    page_h: float,
) -> dict[str, Any]:
    bb = elem["bbox"]
    cx = (bb[0] + bb[2]) * 0.5
    cy = (bb[1] + bb[3]) * 0.5
    bw = bb[2] - bb[0]
    bh = bb[3] - bb[1]
    text = elem.get("text", "")
    words = text.split()
    return {
        "cx": cx,
        "cy": cy,
        "bw": bw,
        "bh": bh,
        "page_w": page_w,
        "page_h": page_h,
        "char_count": len(text),
        "word_count": len(words),
        "is_bold": float(elem.get("bold", False)),
        "font_size_norm": elem.get("font_size", 10) / 12.0,
        "ocr_confidence": elem.get("ocr_confidence", 1.0),
        "text": text,
        "role": elem.get("role", "other"),
        "field_name": elem.get("field_name"),
        "table_id": elem.get("table_id"),
        "row": elem.get("row"),
        "col": elem.get("col"),
        "row_span": elem.get("row_span", 1),
        "col_span": elem.get("col_span", 1),
    }


def fit_learned_B_from_synthetic_pairs(
    elements: list[list[dict[str, Any]]],
    reg: float = 1e-2,
) -> BilinearB:
    """Train B to predict dot and wedge from random pairs (supervised proxy)."""
    rng = np.random.default_rng(0)
    pairs = []
    targets = []
    B0 = geometric_B_d2()
    for doc in elements:
        if len(doc) < 2:
            continue
        for _ in range(min(5, len(doc))):
            i, j = rng.integers(0, len(doc), size=2)
            ei, ej = doc[i], doc[j]
            ui = np.array([ei["cx"] / ei["page_w"], ei["cy"] / ei["page_h"]])
            uj = np.array([ej["cx"] / ej["page_w"], ej["cy"] / ej["page_h"]])
            pairs.append([ui, uj])
            targets.append(B0.evaluate(ui, uj))
    if not pairs:
        return B0
    B, _ = learn_B_ridge(np.array(pairs), np.array(targets), reg=reg)
    return B
