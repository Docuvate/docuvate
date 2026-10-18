import { describe, expect, it } from 'vitest';
import { checkBudgets, checkLayoutPerPage, runFullGateCheck } from './budget-check.js';

describe('checkBudgets', () => {
  it('detects relative fitts regression', () => {
    const regressions = checkBudgets(
      {
        version: 2,
        mode: 'check',
        layoutTolerancePx: 2,
        fittsRelativeMaxIncrease: 0.05,
        klmRelativeMaxIncrease: 0.05,
        metrics: {
          'fitts.upload-document.desktop.sumId': {
            tolerance: 0.05,
            direction: 'relative-max-increase',
          },
        },
      },
      { 'fitts.upload-document.desktop.sumId': 10 },
      { 'fitts.upload-document.desktop.sumId': 11 }
    );
    expect(regressions).toHaveLength(1);
  });
});

describe('checkLayoutPerPage', () => {
  it('flags per-page drift beyond tolerance', () => {
    const regressions = checkLayoutPerPage(
      { 'layout.customer.documents.titleY': 90 },
      { 'layout.customer.documents.titleY': 94 },
      2
    );
    expect(regressions).toHaveLength(1);
  });
});

describe('runFullGateCheck', () => {
  it('combines layout and metric checks', () => {
    const budgets = {
      version: 2 as const,
      mode: 'check' as const,
      layoutTolerancePx: 2,
      fittsRelativeMaxIncrease: 0.05,
      klmRelativeMaxIncrease: 0.05,
      metrics: {
        'targets.desktop.wcagFailures': { tolerance: 0, direction: 'lower-is-better' as const },
      },
    };
    const baseline = {
      'layout.customer.documents.titleY': 90,
      'targets.desktop.wcagFailures': 1,
    };
    const current = {
      'layout.customer.documents.titleY': 90,
      'targets.desktop.wcagFailures': 2,
    };
    const regressions = runFullGateCheck(budgets, baseline, current);
    expect(regressions.some((r) => r.metricKey === 'targets.desktop.wcagFailures')).toBe(true);
  });
});
