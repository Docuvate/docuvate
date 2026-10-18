import { describe, expect, it } from 'vitest';
import { analyzeLayoutConsistency, layoutMetricKey } from './layout.js';
import type { LayoutPageSnapshot } from './types.js';

function page(path: string, titleY: number | null): LayoutPageSnapshot {
  return {
    path,
    title: path,
    scope: 'customer',
    landmarks: { page: true, pageTitle: titleY !== null, primaryAction: true },
    containerLeft: 280,
    containerMaxWidth: 1200,
    containerPaddingTop: 24,
    titleY,
    titleFontSizePx: 28,
    primaryActionX: 1200,
    primaryActionY: 120,
    cardNestingDepth: 1,
    gutterWidthPx: 24,
  };
}

describe('layoutMetricKey', () => {
  it('normalizes document detail UUID paths to a stable slug', () => {
    expect(
      layoutMetricKey('/documents/731eb858-75b7-4041-8079-3a510a43de64', 'titleY')
    ).toBe('layout.customer.documents_detail.titleY');
  });
});

describe('analyzeLayoutConsistency', () => {
  it('flags titleY outliers among measured pages only', () => {
    const report = analyzeLayoutConsistency(
      [page('/a', 100), page('/b', 100), page('/c', 140)],
      []
    );
    expect(report.variance.titleY).toBeGreaterThan(0);
    expect(report.outliers.some((o) => o.metric === 'titleY' && o.page === '/c')).toBe(true);
  });

  it('records missing landmarks separately', () => {
    const report = analyzeLayoutConsistency(
      [
        {
          ...page('/x', 90),
          landmarks: { page: true, pageTitle: false, primaryAction: false },
        },
      ],
      []
    );
    expect(report.missingLandmarks).toHaveLength(1);
    expect(report.missingLandmarks[0]?.missing).toContain('pageTitle');
  });
});
