#!/usr/bin/env python3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "scripts"))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from dsre_lib.evaluate import episode_score_cache, train_head
from dsre_lib.features import HeadKind
from dsre_lib.npz_store import DsreNpz
from dsre_lib.constants import SPLIT_TEST


def curve(data, cache, out_prefix: Path):
    thresholds = np.linspace(-1.0, 1.0, 21)
    rows = []
    for tau in thresholds:
        tp = fp = fn = 0
        for ep, (score, pred_idx, gold) in enumerate(cache):
            if int(data.split[ep]) != SPLIT_TEST or data.field_absent[ep]:
                continue
            if score < tau:
                fn += 1
                continue
            if gold >= 0 and pred_idx == gold:
                tp += 1
            else:
                fp += 1
                fn += 1
        prec = tp / (tp + fp) if (tp + fp) else 1.0
        cov = tp / (tp + fn) if (tp + fn) else 0.0
        rows.append((tau, prec, cov))
    csv = out_prefix.with_suffix(".csv")
    with csv.open("w") as f:
        f.write("threshold,precision,coverage\n")
        for r in rows:
            f.write(f"{r[0]},{r[1]},{r[2]}\n")
    plt.figure(figsize=(6, 4))
    plt.plot([r[2] for r in rows], [r[1] for r in rows], marker=".")
    plt.xlabel("coverage")
    plt.ylabel("precision")
    plt.grid(True, alpha=0.3)
    plt.savefig(out_prefix.with_suffix(".png"), dpi=120, bbox_inches="tight")
    plt.close()


def main():
    for name in ("sroie", "cord"):
        data = DsreNpz.load(ROOT / "data" / f"{name}.npz")
        out_dir = ROOT / "results" / name
        out_dir.mkdir(parents=True, exist_ok=True)
        for kind in (HeadKind.COSINE, HeadKind.RELATIONAL):
            w = train_head(data, kind)
            cache = episode_score_cache(data, kind, w)
            curve(data, cache, out_dir / f"pc_{kind.value}")


if __name__ == "__main__":
    main()
