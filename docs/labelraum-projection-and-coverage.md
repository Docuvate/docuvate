# Labelraum: projection, coverage, and UX

Design note for the Labels page **Labelraum** — find label coverage gaps and decide what to label next.

## Goals

- Show **which documents lack label coverage** (gap list sorted by embedding-space similarity).
- Surface **label overlap** (merge/sharpen decisions).
- Optional **2D map** for orientation (UMAP when enough points, else PCA).

Coverage and gap ordering use **original embeddings**, not the 2D layout.

## Projection

| Method | When | Notes |
|--------|------|--------|
| **PCA 2D** | &lt; 15 combined doc + centroid vectors | Stable, cheap (`pca2.ts`) |
| **UMAP 2D** | ≥ 15 vectors | `umap-js` in API domain (`label-map-projection.ts`) |

Label hulls on the map only when a label has **≥ 5** labeled documents (`labelSpace2DRegions.ts`).

Below **30 documents**, the map is **collapsed by default** in the UI.

## Coverage

Same embedding-space rules as before (`label-coverage.ts`):

- Status: explained / unexplained / outside / unlabeled_near
- Threshold from user preferences (learned near threshold)
- **Gap list sort key:** `coverageScore` = max cosine similarity to any label centroid **or** any already-labeled document (`label-coverage-score.ts`)

KPI: `coveredPercent` (explained / total), `gapCount` (non-explained).

## Overlap matrix

`buildLabelOverlapMatrix` — pairwise centroid / cross-document similarity; pairs ≥ 0.78 link to merge recommendation ids.

## Files

- API: `get-label-map.use-case.ts`, `label-coverage.ts`, `label-coverage-score.ts`, `label-overlap-matrix.ts`, `label-map-projection.ts`
- Contracts: extended `LabelMapResponseDto`
- Web: `LabelSpaceMap.tsx`, `LabelSpaceGapList.tsx`, `LabelSpaceOverlapMatrix.tsx`, `LabelSpaceMap2D.tsx`
