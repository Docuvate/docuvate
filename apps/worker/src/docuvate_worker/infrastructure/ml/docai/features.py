# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Verbatim copies of the training feature code — parity-tested; do not edit."""
import math
import unicodedata

import numpy as np


def digits(s): return ''.join(c for c in s if c.isdigit())
def node_geom(d):
    U = d['units']; n = len(U)
    if n == 0: return np.zeros((0, 22), np.float32), [[] for _ in range(0)]
    B = np.array([u['box'] for u in U], float); W, H = d['w'], d['h']
    h = np.clip(B[:, 3] - B[:, 1], 1, None); mh = np.median(h); cy = (B[:, 1] + B[:, 3]) / 2; cx = (B[:, 0] + B[:, 2]) / 2
    order = np.argsort(np.argsort(cy)) / max(n - 1, 1)
    rows = []
    for i in range(n):
        ov = np.clip(np.minimum(B[i, 3], B[:, 3]) - np.maximum(B[i, 1], B[:, 1]), 0, None) / np.minimum(h[i], h)
        rows.append(np.where(ov > 0.5)[0])
    F = []
    for i, u in enumerate(U):
        t = u['text']; L = max(len(t), 1); r = rows[i]; xs = np.argsort(B[r, 0]); pos = list(r[xs]).index(i)
        num = digits(t); is_num = float(len(num) > 0 and all(c.isdigit() or c in ',.- ' for c in t.strip()))
        F.append([B[i, 0] / W, B[i, 1] / H, B[i, 2] / W, B[i, 3] / H, cx[i] / W, cy[i] / H, (B[i, 2] - B[i, 0]) / W, h[i] / mh,
                  order[i], math.log1p(n), math.log1p(len(t)), len(num) / L, sum(c.isalpha() for c in t) / L,
                  sum(c.isupper() for c in t) / L, t.count(' ') / L, is_num, math.log1p(float(''.join(str(unicodedata.digit(c)) for c in num[-12:])) if num else 0),
                  len(r), pos / max(len(r) - 1, 1), float(pos == len(r) - 1), float(pos == 0), (B[i, 2] - B[:, 2].max()) / W])
    return np.array(F, np.float32), rows
def node_ctx(d, G, E, rows):
    """Context: left/right same-row neighbour geometry+embedding, units directly above/below (embedding)."""
    U = d['units']; n = len(U); B = np.array([u['box'] for u in U], float).reshape(-1, 4); cy = (B[:, 1] + B[:, 3]) / 2
    C = []
    for i in range(n):
        r = [j for j in rows[i] if j != i]
        left = [j for j in r if B[j, 2] <= B[i, 0] + 2]; right = [j for j in r if B[j, 0] >= B[i, 2] - 2]
        l = max(left, key=lambda j: B[j, 2]) if left else None; rt = min(right, key=lambda j: B[j, 0]) if right else None
        above = [j for j in range(n) if cy[j] < B[i, 1] and j not in rows[i]]; below = [j for j in range(n) if cy[j] > B[i, 3] and j not in rows[i]]
        a = max(above, key=lambda j: cy[j]) if above else None; b = min(below, key=lambda j: cy[j]) if below else None
        z = np.zeros(E.shape[1], np.float32); zg = np.zeros(G.shape[1], np.float32)
        C.append(np.concatenate([G[l] if l is not None else zg, E[l] if l is not None else z, [l is None],
                                 G[rt] if rt is not None else zg, E[rt] if rt is not None else z, [rt is None],
                                 E[a] if a is not None else z, E[b] if b is not None else z]))
    return np.array(C, np.float32).reshape(n, -1)
def cand_sets(d, P, classes, src, dst, tau, oracle=False):
    if oracle:
        return [i for i, l in enumerate(d['y']) if l == src], [j for j, l in enumerate(d['y']) if l == dst]
    a, b = classes.index(src), classes.index(dst)
    return [i for i in range(len(d['y'])) if P[i, a] >= tau], [j for j in range(len(d['y'])) if P[j, b] >= tau]
def pair_feats(d, P, S, T, pca):
    B = np.array([u['box'] for u in d['units']], float); mh = max(np.median(B[:, 3] - B[:, 1]), 1); W = d['w']
    cy = (B[:, 1] + B[:, 3]) / 2; cx = (B[:, 0] + B[:, 2]) / 2; Z = pca.transform(d['E']) if len(d['E']) else None
    node = np.hstack([d['G'], P, Z]); rows, pairs = [], []
    for j in T:
        ds = np.array([abs(cy[i] - cy[j]) for i in S]); rk = np.argsort(np.argsort(ds)) if len(S) else []
        for r, i in zip(rk, S):
            if i == j: continue
            lo, hi = sorted((cy[i], cy[j])); ov = max(0, min(B[i, 3], B[j, 3]) - max(B[i, 1], B[j, 1])) / max(min(B[i, 3] - B[i, 1], B[j, 3] - B[j, 1]), 1)
            nb_t = sum(lo < cy[t] < hi for t in T if t != j); nb_s = sum(lo < cy[s] < hi for s in S if s != i)
            rows.append(np.concatenate([node[i], node[j], [(cy[j] - cy[i]) / mh, abs(cy[j] - cy[i]) / mh, (B[j, 1] - B[i, 1]) / mh,
                        (B[j, 0] - B[i, 2]) / W, (cx[j] - cx[i]) / W, ov, float(B[j, 0] >= B[i, 0]), r, nb_t, nb_s,
                        float(d['E'][i] @ d['E'][j]), np.hypot((cx[j] - cx[i]) / W, (cy[j] - cy[i]) / d['h'])]]))
            pairs.append((i, j))
    return (np.array(rows, np.float32) if rows else np.zeros((0, 2 * node.shape[1] + 12), np.float32)), pairs
def decode(meta, sc, ndoc, th, src_cap=1):
    out = [[] for _ in range(ndoc)]; o = np.argsort(-sc); used_t, used_s = set(), {}
    for k in o:
        if sc[k] < th: break
        di, i, j = meta[k]
        if (di, j) in used_t or used_s.get((di, i), 0) >= src_cap: continue
        used_t.add((di, j)); used_s[(di, i)] = used_s.get((di, i), 0) + 1; out[di].append((i, j, float(sc[k])))
    return out
def dir_nbrs(d, rows):
    U = d['units']; n = len(U); B = np.array([u['box'] for u in U], float).reshape(-1, 4); cy = (B[:, 1] + B[:, 3]) / 2; cx = (B[:, 0] + B[:, 2]) / 2
    out = []
    for i in range(n):
        r = [j for j in rows[i] if j != i]; rs = set(rows[i])
        left = [j for j in r if B[j, 2] <= B[i, 0] + 2]; right = [j for j in r if B[j, 0] >= B[i, 2] - 2]
        above = [j for j in range(n) if cy[j] < B[i, 1] and j not in rs]; below = [j for j in range(n) if cy[j] > B[i, 3] and j not in rs]
        # above/below: prefer horizontally overlapping units, nearest vertically
        def vbest(c, key):
            if not c: return None
            ov = [j for j in c if min(B[i, 2], B[j, 2]) - max(B[i, 0], B[j, 0]) > 0]
            return min(ov or c, key=key)
        out.append([max(left, key=lambda j: B[j, 2]) if left else None, min(right, key=lambda j: B[j, 0]) if right else None,
                    vbest(above, lambda j: B[i, 1] - cy[j]), vbest(below, lambda j: cy[j] - B[i, 3])])
    return out, B, cx, cy
def nbr_feats(d, P, cache):
    n = len(d['units']); k = P.shape[1]
    if n == 0: return np.zeros((0, 4 * (k + 2) + 2 * k + 1), np.float32)
    if 'nb' not in cache: cache['nb'] = dir_nbrs(d, d['rows'])
    nb, B, cx, cy = cache['nb']; W, H = d['w'], d['h']; F = []
    D = np.hypot((cx[:, None] - cx[None]) / W, (cy[:, None] - cy[None]) / H); np.fill_diagonal(D, np.inf)
    for i in range(n):
        f = []
        for j in nb[i]:
            if j is None: f += [0.0] * k + [1.0, 1.0]
            else: f += list(P[j]) + [0.0, float(D[i, j])]
        kn = np.argsort(D[i])[:min(4, n - 1)] if n > 1 else []
        f += list(P[kn].mean(0)) if len(kn) else [0.0] * k
        f += list(P[i]); f += [float(D[i, kn[0]]) if len(kn) else 1.0]
        F.append(f)
    return np.array(F, np.float32)
