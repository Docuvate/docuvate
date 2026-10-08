import type {
  LayoutConsistencyReport,
  LayoutLandmarks,
  LayoutMissingLandmark,
  LayoutPageSnapshot,
} from './types.js';

const METRICS: Array<keyof LayoutPageSnapshot> = [
  'containerLeft',
  'containerMaxWidth',
  'containerPaddingTop',
  'titleY',
  'titleFontSizePx',
  'primaryActionX',
  'primaryActionY',
  'cardNestingDepth',
  'gutterWidthPx',
];

function numericValues(pages: LayoutPageSnapshot[], key: keyof LayoutPageSnapshot): number[] {
  return pages
    .map((p) => p[key])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}

function variance(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function collectMissingLandmarks(pages: LayoutPageSnapshot[]): LayoutMissingLandmark[] {
  const out: LayoutMissingLandmark[] = [];
  for (const page of pages) {
    const missing: Array<keyof LayoutLandmarks> = [];
    for (const key of ['page', 'pageTitle', 'primaryAction'] as const) {
      if (!page.landmarks[key]) {
        missing.push(key);
      }
    }
    if (missing.length > 0) {
      out.push({ path: page.path, title: page.title, missing });
    }
  }
  return out;
}

export function analyzeLayoutConsistency(
  customerPages: LayoutPageSnapshot[],
  devPages: LayoutPageSnapshot[]
): LayoutConsistencyReport {
  const varianceRecord = {} as LayoutConsistencyReport['variance'];
  for (const key of METRICS) {
    varianceRecord[key] = variance(numericValues(customerPages, key));
  }

  const outliers: LayoutConsistencyReport['outliers'] = [];
  for (const key of METRICS) {
    const values = customerPages
      .map((p) => ({ page: p.path, value: p[key] }))
      .filter((row): row is { page: string; value: number } => typeof row.value === 'number');
    if (values.length === 0) {
      continue;
    }
    const med = median(values.map((v) => v.value));
    for (const row of values) {
      if (Math.abs(row.value - med) > 0.5) {
        outliers.push({
          metric: key,
          page: row.page,
          value: row.value,
          median: med,
        });
      }
    }
  }

  outliers.sort((a, b) => Math.abs(b.value - b.median) - Math.abs(a.value - a.median));

  return {
    customerPages,
    devPages,
    missingLandmarks: collectMissingLandmarks([...customerPages, ...devPages]),
    variance: varianceRecord,
    outliers,
  };
}

export function layoutMetricKey(path: string, metric: string): string {
  const stablePath = path.replace(
    /\/documents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/documents/detail'
  );
  const slug = stablePath.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root';
  return `layout.customer.${slug}.${metric}`;
}
