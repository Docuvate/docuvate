import type { UxMetricsReport } from '../metrics/types.js';
import { FITTS_LITERATURE } from '../metrics/fitts.js';
import { KLM_CITATION } from '../metrics/klm.js';

function worstFittsDesktop(report: UxMetricsReport, limit: number) {
  return [...report.fitts]
    .filter((f) => f.viewport === 'desktop')
    .sort((a, b) => b.sumIndexOfDifficulty - a.sumIndexOfDifficulty)
    .slice(0, limit);
}

function worstKlm(report: UxMetricsReport, limit: number) {
  return [...report.klm].sort((a, b) => b.predictedTimeMs - a.predictedTimeMs).slice(0, limit);
}

function formatBox(b: { x: number; y: number; width: number; height: number }): string {
  return `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}×${Math.round(b.height)}`;
}

export function generateMarkdownReport(
  report: UxMetricsReport,
  targetSummary: Record<'desktop' | 'mobile', { wcagFailures: number; primaryHeightFailures: number }>
): string {
  const lines: string[] = [];
  lines.push('# Docuvate UX metrics report');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Git SHA: ${report.gitSha ?? 'unknown'}`);
  lines.push(`Web base: ${report.webBase}`);
  lines.push(`Seed user: ${report.seedEmail}`);
  if (report.skippedFittsTaskIds.length > 0) {
    lines.push('');
    lines.push('## Skipped tasks (optional product UI not present)');
    lines.push('');
    for (const id of report.skippedFittsTaskIds) {
      lines.push(`- \`${id}\` — harness soft-skipped (no matching \`data-ux\` landmark)`);
    }
  }
  lines.push('');
  lines.push('## Top Fitts tasks (model estimate, desktop viewport)');
  lines.push('');
  lines.push(
    `Movement time uses MT = ${FITTS_LITERATURE.interceptMs} + ${FITTS_LITERATURE.slopeMsPerBit} × ID (ms). Source: ${FITTS_LITERATURE.citation}`
  );
  lines.push('');
  for (const row of worstFittsDesktop(report, 10)) {
    lines.push(
      `- **${row.label}** (${row.taskId}): ΣID=${row.sumIndexOfDifficulty.toFixed(3)}, ΣMT≈${row.sumPredictedMovementTimeMs.toFixed(0)}ms`
    );
  }
  lines.push('');
  lines.push('## Fitts movement breakdown (desktop, all tasks)');
  lines.push('');
  for (const task of report.fitts.filter((f) => f.viewport === 'desktop')) {
    lines.push(`### ${task.label} (\`${task.taskId}\`)`);
    if (task.segments.length === 0) {
      lines.push('- (no pointer segments recorded)');
      continue;
    }
    for (const [i, seg] of task.segments.entries()) {
      lines.push(
        `${i + 1}. ${seg.fromHint} → ${seg.toHint}: D=${seg.distance.toFixed(0)}px, W=${seg.effectiveWidth.toFixed(1)}px, ID=${seg.indexOfDifficulty.toFixed(3)}, boxes ${formatBox(seg.from)} → ${formatBox(seg.to)}`
      );
    }
    lines.push('');
  }
  lines.push('## Top KLM-GOMS tasks (predicted)');
  lines.push('');
  lines.push(`Operator times: ${KLM_CITATION}`);
  lines.push('');
  for (const row of worstKlm(report, 10)) {
    lines.push(
      `- **${row.label}**: ${(row.predictedTimeMs / 1000).toFixed(2)}s · ${row.clicks} clicks · ${row.keystrokes} keys · ${row.pointerKeyboardSwitches} switches`
    );
  }
  lines.push('');
  lines.push('## Layout consistency (customer pages only)');
  lines.push('');
  if (report.layout.missingLandmarks.length > 0) {
    lines.push('### Missing landmarks (not counted as px drift)');
    lines.push('');
    for (const m of report.layout.missingLandmarks) {
      lines.push(`- \`${m.path}\` (${m.title}): missing ${m.missing.join(', ')}`);
    }
    lines.push('');
  }
  for (const outlier of report.layout.outliers.slice(0, 20)) {
    lines.push(
      `- \`${outlier.page}\` **${outlier.metric}**: ${outlier.value}px (median ${outlier.median}px, Δ=${Math.abs(outlier.value - outlier.median).toFixed(1)}px)`
    );
  }
  if (report.layout.devPages.length > 0) {
    lines.push('');
    lines.push('## Dev / design-system pages (informational, excluded from customer variance)');
    lines.push('');
    for (const p of report.layout.devPages) {
      lines.push(
        `- \`${p.path}\`: containerLeft=${p.containerLeft ?? 'null'}, maxWidth=${p.containerMaxWidth ?? 'null'}, titleY=${p.titleY ?? 'null'}`
      );
    }
  }
  lines.push('');
  lines.push('## Target sizes (WCAG 2.5.8 failures)');
  lines.push('');
  lines.push(
    `- Desktop summary: ${targetSummary.desktop.wcagFailures} failures / ${report.targetSizes.desktop.length} controls`
  );
  lines.push(
    `- Mobile summary: ${targetSummary.mobile.wcagFailures} failures / ${report.targetSizes.mobile.length} controls`
  );
  lines.push('');
  for (const viewport of ['desktop', 'mobile'] as const) {
    lines.push(`### ${viewport}`);
    const fails = report.targetSizes[viewport].filter((t) => !t.wcag258Pass);
    for (const f of fails) {
      lines.push(
        `- \`${f.route}\` \`${f.selectorHint}\` (${f.role}) "${f.name}" · ${Math.round(f.box.width)}×${Math.round(f.box.height)}px`
      );
    }
    if (fails.length === 0) {
      lines.push('- (none)');
    }
    lines.push('');
  }
  lines.push('## Stability & accessibility');
  lines.push('');
  lines.push(`- Nested scroll containers: ${report.stability.nestedScrollContainerCount}`);
  for (const [k, v] of Object.entries(report.stability.clsByInteraction)) {
    lines.push(`- CLS \`${k}\`: ${v.toFixed(4)}`);
  }
  lines.push(`- axe violations (node count): ${report.accessibility.axeViolationCount}`);
  if (report.accessibility.axeViolations.length > 0) {
    lines.push('');
    lines.push('### axe details');
    for (const v of report.accessibility.axeViolations) {
      lines.push(
        `- \`${v.id}\` (${v.impact}) on \`${v.route}\`: ${v.description} · nodes: ${v.nodeTargets.join(' | ')}`
      );
    }
  }
  if (report.accessibility.lighthouseNote) {
    lines.push(`- Lighthouse: ${report.accessibility.lighthouseNote}`);
  }
  lines.push('');
  lines.push('## Hick-Hyman (informational choice counts)');
  lines.push('');
  for (const h of report.hick) {
    lines.push(`- ${h.label}: ${h.visibleChoices} visible choices`);
  }
  lines.push('');
  return lines.join('\n');
}

export function generateHtmlReport(
  report: UxMetricsReport,
  targetSummary: Record<'desktop' | 'mobile', { wcagFailures: number; primaryHeightFailures: number }>
): string {
  const md = generateMarkdownReport(report, targetSummary);
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><title>UX metrics</title>
<style>body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;line-height:1.5;white-space:pre-wrap}code{background:#f1f5f9;padding:2px 4px;border-radius:4px}</style>
</head><body>${escaped}</body></html>`;
}
