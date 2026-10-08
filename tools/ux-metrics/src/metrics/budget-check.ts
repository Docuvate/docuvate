import { layoutMetricKey } from './layout.js';
import type { LayoutPageSnapshot, UxMetricsReport } from './types.js';

export interface MetricBudget {
  description?: string;
  tolerance: number;
  direction: 'lower-is-better' | 'higher-is-better' | 'exact' | 'relative-max-increase';
}

export interface UxBudgetsFile {
  version: number;
  mode: 'report-only' | 'check';
  layoutTolerancePx: number;
  fittsRelativeMaxIncrease: number;
  klmRelativeMaxIncrease: number;
  metrics: Record<string, MetricBudget>;
}

export interface BudgetRegression {
  metricKey: string;
  baseline: number;
  current: number;
  delta: number;
  tolerance: number;
  message: string;
}

function compareValues(
  baseline: number,
  current: number,
  budget: MetricBudget
): BudgetRegression | null {
  const delta = current - baseline;
  const absDelta = Math.abs(delta);

  switch (budget.direction) {
    case 'relative-max-increase': {
      const limit = baseline * (1 + budget.tolerance);
      if (current > limit + 1e-9) {
        return {
          metricKey: '',
          baseline,
          current,
          delta,
          tolerance: budget.tolerance,
          message: `regressed above ${(budget.tolerance * 100).toFixed(0)}% increase (${baseline.toFixed(3)} → ${current.toFixed(3)})`,
        };
      }
      return null;
    }
    case 'lower-is-better':
      if (current > baseline + budget.tolerance) {
        return {
          metricKey: '',
          baseline,
          current,
          delta,
          tolerance: budget.tolerance,
          message: `regressed higher by ${absDelta.toFixed(3)} (allowed ${budget.tolerance})`,
        };
      }
      return null;
    case 'higher-is-better':
      if (current < baseline - budget.tolerance) {
        return {
          metricKey: '',
          baseline,
          current,
          delta,
          tolerance: budget.tolerance,
          message: `regressed lower by ${absDelta.toFixed(3)} (allowed ${budget.tolerance})`,
        };
      }
      return null;
    case 'exact':
      if (absDelta > budget.tolerance) {
        return {
          metricKey: '',
          baseline,
          current,
          delta,
          tolerance: budget.tolerance,
          message: `drifted by ${absDelta.toFixed(3)} (allowed ${budget.tolerance})`,
        };
      }
      return null;
    default: {
      const _exhaustive: never = budget.direction;
      return _exhaustive;
    }
  }
}

export function checkBudgets(
  budgets: UxBudgetsFile,
  baselineFlat: Record<string, number>,
  currentFlat: Record<string, number>
): BudgetRegression[] {
  const regressions: BudgetRegression[] = [];
  for (const [key, budget] of Object.entries(budgets.metrics)) {
    const baseline = baselineFlat[key];
    const current = currentFlat[key];
    if (baseline === undefined || current === undefined) {
      continue;
    }
    const hit = compareValues(baseline, current, budget);
    if (hit) {
      regressions.push({ ...hit, metricKey: key });
    }
  }
  return regressions;
}

export function flattenReportForBudgets(report: UxMetricsReport): Record<string, number> {
  const flat: Record<string, number> = {};
  for (const f of report.fitts) {
    flat[`fitts.${f.taskId}.${f.viewport}.sumId`] = f.sumIndexOfDifficulty;
    flat[`fitts.${f.taskId}.${f.viewport}.sumMtMs`] = f.sumPredictedMovementTimeMs;
  }
  for (const k of report.klm) {
    flat[`klm.${k.taskId}.predictedMs`] = k.predictedTimeMs;
  }
  for (const page of report.layout.customerPages) {
    for (const metric of [
      'containerLeft',
      'containerMaxWidth',
      'containerPaddingTop',
      'titleY',
      'titleFontSizePx',
      'primaryActionX',
      'primaryActionY',
      'cardNestingDepth',
      'gutterWidthPx',
    ] as const) {
      const value = page[metric];
      if (typeof value === 'number') {
        flat[layoutMetricKey(page.path, metric)] = value;
      }
    }
  }
  flat['targets.desktop.wcagFailures'] = report.targetSizes.desktop.filter((t) => !t.wcag258Pass)
    .length;
  flat['targets.mobile.wcagFailures'] = report.targetSizes.mobile.filter((t) => !t.wcag258Pass)
    .length;
  flat['stability.nestedScrollContainers'] = report.stability.nestedScrollContainerCount;
  for (const [interaction, cls] of Object.entries(report.stability.clsByInteraction)) {
    flat[`stability.cls.${interaction}`] = cls;
  }
  flat['accessibility.axeViolations'] = report.accessibility.axeViolationCount;
  return flat;
}

export function buildDefaultBudgetEntries(
  report: UxMetricsReport,
  budgets: UxBudgetsFile
): UxBudgetsFile['metrics'] {
  const metrics: UxBudgetsFile['metrics'] = { ...budgets.metrics };
  for (const key of Object.keys(metrics)) {
    if (/^layout\.customer\.documents_[0-9a-f_]+\./i.test(key)) {
      delete metrics[key];
    }
  }
  for (const f of report.fitts) {
    if (f.viewport !== 'desktop') {
      continue;
    }
    const key = `fitts.${f.taskId}.${f.viewport}.sumId`;
    metrics[key] = {
      direction: 'relative-max-increase',
      tolerance: budgets.fittsRelativeMaxIncrease,
    };
  }
  for (const k of report.klm) {
    metrics[`klm.${k.taskId}.predictedMs`] = {
      direction: 'relative-max-increase',
      tolerance: budgets.klmRelativeMaxIncrease,
    };
  }
  for (const page of report.layout.customerPages) {
    for (const metric of [
      'containerLeft',
      'containerMaxWidth',
      'titleY',
      'titleFontSizePx',
    ] as const) {
      if (typeof page[metric] === 'number') {
        metrics[layoutMetricKey(page.path, metric)] = {
          direction: 'exact',
          tolerance: budgets.layoutTolerancePx,
        };
      }
    }
  }
  metrics['targets.desktop.wcagFailures'] = { direction: 'lower-is-better', tolerance: 0 };
  metrics['targets.mobile.wcagFailures'] = { direction: 'lower-is-better', tolerance: 0 };
  metrics['accessibility.axeViolations'] = { direction: 'lower-is-better', tolerance: 0 };
  for (const key of Object.keys(report.stability.clsByInteraction)) {
    metrics[`stability.cls.${key}`] = { direction: 'exact', tolerance: 0.0001 };
  }
  return metrics;
}

export function checkLayoutPerPage(
  baseline: Record<string, number>,
  current: Record<string, number>,
  tolerancePx: number
): BudgetRegression[] {
  const regressions: BudgetRegression[] = [];
  for (const [key, baseVal] of Object.entries(baseline)) {
    if (!key.startsWith('layout.customer.')) {
      continue;
    }
    const curVal = current[key];
    if (curVal === undefined) {
      regressions.push({
        metricKey: key,
        baseline: baseVal,
        current: NaN,
        delta: NaN,
        tolerance: tolerancePx,
        message: 'missing layout metric in current run',
      });
      continue;
    }
    if (Math.abs(curVal - baseVal) > tolerancePx) {
      regressions.push({
        metricKey: key,
        baseline: baseVal,
        current: curVal,
        delta: curVal - baseVal,
        tolerance: tolerancePx,
        message: `layout drift ${Math.abs(curVal - baseVal).toFixed(1)}px (allowed ${tolerancePx}px)`,
      });
    }
  }
  return regressions;
}

export function runFullGateCheck(
  budgets: UxBudgetsFile,
  baselineFlat: Record<string, number>,
  currentFlat: Record<string, number>
): BudgetRegression[] {
  const mergedMetrics: UxBudgetsFile['metrics'] = { ...budgets.metrics };
  for (const key of Object.keys(baselineFlat)) {
    if (key.startsWith('fitts.') && key.endsWith('.sumId')) {
      mergedMetrics[key] = {
        direction: 'relative-max-increase',
        tolerance: budgets.fittsRelativeMaxIncrease,
      };
    }
    if (key.startsWith('klm.') && key.endsWith('.predictedMs')) {
      mergedMetrics[key] = {
        direction: 'relative-max-increase',
        tolerance: budgets.klmRelativeMaxIncrease,
      };
    }
    if (key.startsWith('stability.cls.')) {
      mergedMetrics[key] = { direction: 'exact', tolerance: 0.0001 };
    }
  }
  return [
    ...checkBudgets({ ...budgets, metrics: mergedMetrics }, baselineFlat, currentFlat),
    ...checkLayoutPerPage(baselineFlat, currentFlat, budgets.layoutTolerancePx),
  ];
}
