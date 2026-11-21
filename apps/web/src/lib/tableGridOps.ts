// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionTableCellDto,
  DocumentRegionTableDto,
  DocumentRegionTableMergeDto,
  DocumentRegionTableRuleDto,
  DocumentRegionTableRowRoleDto,
} from '@docuvate/contracts';
import { tableGridSize } from '@docuvate/contracts';

import type { TableStructureChoice } from './tableLayouts';

interface TableGridDraft {
  choice: TableStructureChoice;
  rules: DocumentRegionTableRuleDto[];
  cells: DocumentRegionTableCellDto[];
}

function cloneRules(rules: readonly DocumentRegionTableRuleDto[]): DocumentRegionTableRuleDto[] {
  return rules.map((rule) => ({ ...rule }));
}

function axisRules(
  rules: readonly DocumentRegionTableRuleDto[],
  axis: 'row' | 'col'
): DocumentRegionTableRuleDto[] {
  return rules.filter((rule) => rule.axis === axis).sort((a, b) => a.ord - b.ord);
}

function reindexAxis(
  rules: readonly DocumentRegionTableRuleDto[],
  axis: 'row' | 'col'
): DocumentRegionTableRuleDto[] {
  const other = rules.filter((rule) => rule.axis !== axis);
  const sorted = [...axisRules(rules, axis)]
    .sort((a, b) => a.pos - b.pos)
    .map((rule, ord) => ({ ...rule, ord }));
  return [...other, ...sorted];
}

function shiftMergesAfterRow(
  merges: readonly DocumentRegionTableMergeDto[],
  at: number,
  delta: number
): DocumentRegionTableMergeDto[] {
  return merges
    .map((merge) => {
      if (merge.row0 + merge.rowSpan - 1 < at) return { ...merge };
      if (merge.row0 >= at) return { ...merge, row0: merge.row0 + delta };
      return { ...merge, rowSpan: merge.rowSpan + delta };
    })
    .filter((merge) => merge.rowSpan > 0 && merge.colSpan > 0);
}

function shiftMergesAfterCol(
  merges: readonly DocumentRegionTableMergeDto[],
  at: number,
  delta: number
): DocumentRegionTableMergeDto[] {
  return merges
    .map((merge) => {
      if (merge.col0 + merge.colSpan - 1 < at) return { ...merge };
      if (merge.col0 >= at) return { ...merge, col0: merge.col0 + delta };
      return { ...merge, colSpan: merge.colSpan + delta };
    })
    .filter((merge) => merge.rowSpan > 0 && merge.colSpan > 0);
}

function shiftRoles(
  roles: readonly DocumentRegionTableRowRoleDto[],
  at: number,
  delta: number
): DocumentRegionTableRowRoleDto[] {
  return roles
    .map((entry) => (entry.row >= at ? { ...entry, row: entry.row + delta } : { ...entry }))
    .filter((entry) => entry.row >= 0);
}

function shiftCellsRow(
  cells: readonly DocumentRegionTableCellDto[],
  at: number,
  delta: number
): DocumentRegionTableCellDto[] {
  return cells
    .map((cell) => (cell.row >= at ? { ...cell, row: cell.row + delta } : { ...cell }))
    .filter((cell) => cell.row >= 0);
}

function shiftCellsCol(
  cells: readonly DocumentRegionTableCellDto[],
  at: number,
  delta: number
): DocumentRegionTableCellDto[] {
  return cells
    .map((cell) => (cell.col >= at ? { ...cell, col: cell.col + delta } : { ...cell }))
    .filter((cell) => cell.col >= 0);
}

/** Insert a row divider so a new empty band appears at `at` (0 = top). */
export function insertTableRow(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  at: number
): TableGridDraft {
  const rules = cloneRules(choice.rules ?? table.rules);
  const rowAxis = axisRules(rules, 'row');
  const band = Math.max(0, Math.min(at, Math.max(0, rowAxis.length - 1)));
  const before = rowAxis[band] ?? rowAxis[0];
  const after = rowAxis[band + 1] ?? rowAxis[rowAxis.length - 1];
  if (!before || !after) {
    return { choice, rules: table.rules, cells: table.cells };
  }
  const pos = (before.pos + after.pos) / 2;
  const nextRules = reindexAxis(
    [...rules, { axis: 'row', ord: rowAxis.length, pos, line: 'thin' as const }],
    'row'
  );
  const cells = shiftCellsRow(choice.cells ?? table.cells, band, 1);
  const merges = shiftMergesAfterRow(choice.merges, band, 1);
  const rowRoles = shiftRoles(choice.rowRoles, band, 1);
  return {
    rules: nextRules,
    cells,
    choice: {
      ...choice,
      merges,
      rowRoles,
      rules: nextRules,
      cells,
      ruleLines: nextRules
        .filter((rule) => rule.line !== 'unknown')
        .map(({ axis, ord, line }) => ({ axis, ord, line })),
    },
  };
}

/** Remove the band at `at` (drops the divider after that band when possible). */
export function deleteTableRow(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  at: number
): TableGridDraft {
  const rules = cloneRules(choice.rules ?? table.rules);
  const rowAxis = axisRules(rules, 'row');
  const { rows } = tableGridSize({ rules, cells: choice.cells ?? table.cells });
  if (rows <= 1 || at < 0 || at >= rows) {
    return { choice, rules: table.rules, cells: table.cells };
  }
  const dropOrd = at + 1 < rowAxis.length ? at + 1 : at;
  const drop = rowAxis[dropOrd];
  if (!drop) {
    return { choice, rules: table.rules, cells: table.cells };
  }
  const nextRules = reindexAxis(
    rules.filter((rule) => !(rule.axis === 'row' && rule.ord === drop.ord)),
    'row'
  );
  const cells = (choice.cells ?? table.cells)
    .filter((cell) => cell.row !== at)
    .map((cell) => (cell.row > at ? { ...cell, row: cell.row - 1 } : cell));
  const merges = shiftMergesAfterRow(
    choice.merges.filter((merge) => merge.row0 !== at || merge.rowSpan !== 1),
    at + 1,
    -1
  );
  const rowRoles = shiftRoles(
    choice.rowRoles.filter((entry) => entry.row !== at),
    at + 1,
    -1
  );
  const headerRows = Math.min(choice.headerRows, Math.max(0, rows - 2));
  const footerRows = Math.min(choice.footerRows, Math.max(0, rows - 2 - headerRows));
  return {
    rules: nextRules,
    cells,
    choice: {
      ...choice,
      headerRows,
      footerRows,
      merges,
      rowRoles,
      rules: nextRules,
      cells,
      ruleLines: nextRules
        .filter((rule) => rule.line !== 'unknown')
        .map(({ axis, ord, line }) => ({ axis, ord, line })),
    },
  };
}

export function insertTableCol(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  at: number
): TableGridDraft {
  const rules = cloneRules(choice.rules ?? table.rules);
  const colAxis = axisRules(rules, 'col');
  const band = Math.max(0, Math.min(at, Math.max(0, colAxis.length - 1)));
  const before = colAxis[band] ?? colAxis[0];
  const after = colAxis[band + 1] ?? colAxis[colAxis.length - 1];
  if (!before || !after) {
    return { choice, rules: table.rules, cells: table.cells };
  }
  const pos = (before.pos + after.pos) / 2;
  const nextRules = reindexAxis(
    [...rules, { axis: 'col', ord: colAxis.length, pos, line: 'thin' as const }],
    'col'
  );
  const cells = shiftCellsCol(choice.cells ?? table.cells, band, 1);
  const merges = shiftMergesAfterCol(choice.merges, band, 1);
  return {
    rules: nextRules,
    cells,
    choice: {
      ...choice,
      merges,
      rules: nextRules,
      cells,
      ruleLines: nextRules
        .filter((rule) => rule.line !== 'unknown')
        .map(({ axis, ord, line }) => ({ axis, ord, line })),
    },
  };
}

export function deleteTableCol(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  at: number
): TableGridDraft {
  const rules = cloneRules(choice.rules ?? table.rules);
  const colAxis = axisRules(rules, 'col');
  const { cols } = tableGridSize({ rules, cells: choice.cells ?? table.cells });
  if (cols <= 1 || at < 0 || at >= cols) {
    return { choice, rules: table.rules, cells: table.cells };
  }
  const dropOrd = at + 1 < colAxis.length ? at + 1 : at;
  const drop = colAxis[dropOrd];
  if (!drop) {
    return { choice, rules: table.rules, cells: table.cells };
  }
  const nextRules = reindexAxis(
    rules.filter((rule) => !(rule.axis === 'col' && rule.ord === drop.ord)),
    'col'
  );
  const cells = (choice.cells ?? table.cells)
    .filter((cell) => cell.col !== at)
    .map((cell) => (cell.col > at ? { ...cell, col: cell.col - 1 } : cell));
  const merges = shiftMergesAfterCol(
    choice.merges.filter((merge) => merge.col0 !== at || merge.colSpan !== 1),
    at + 1,
    -1
  );
  const headerCols = Math.min(choice.headerCols, Math.max(0, cols - 2));
  const trailingHeaderCols = Math.min(
    choice.trailingHeaderCols,
    Math.max(0, cols - 2 - headerCols)
  );
  return {
    rules: nextRules,
    cells,
    choice: {
      ...choice,
      headerCols,
      trailingHeaderCols,
      merges,
      rules: nextRules,
      cells,
      ruleLines: nextRules
        .filter((rule) => rule.line !== 'unknown')
        .map(({ axis, ord, line }) => ({ axis, ord, line })),
    },
  };
}

/**
 * Split the band under a normalized page position by inserting a divider there.
 * Cell/merge indexes after the split band shift so existing text stays in the
 * top/left half. Returns null when the point is on/near a guide or outside the frame.
 */
export function splitTableBandAtPos(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  axis: 'row' | 'col',
  pos: number
): TableGridDraft | null {
  const minGap = 0.004;
  const rules = cloneRules(choice.rules ?? table.rules);
  const axisList = axisRules(rules, axis);
  let band = -1;
  for (let i = 0; i < axisList.length - 1; i += 1) {
    const before = axisList[i];
    const after = axisList[i + 1];
    if (!before || !after) continue;
    if (pos > before.pos + minGap && pos < after.pos - minGap) {
      band = i;
      break;
    }
  }
  if (band < 0) return null;
  const nextRules = reindexAxis(
    [...rules, { axis, ord: axisList.length, pos, line: 'thin' as const }],
    axis
  );
  const cellsSrc = choice.cells ?? table.cells;
  const cells =
    axis === 'row' ? shiftCellsRow(cellsSrc, band + 1, 1) : shiftCellsCol(cellsSrc, band + 1, 1);
  const merges =
    axis === 'row'
      ? shiftMergesAfterRow(choice.merges, band + 1, 1)
      : shiftMergesAfterCol(choice.merges, band + 1, 1);
  const rowRoles =
    axis === 'row'
      ? shiftRoles(choice.rowRoles, band + 1, 1)
      : choice.rowRoles.map((r) => ({ ...r }));
  return {
    rules: nextRules,
    cells,
    choice: {
      ...choice,
      merges,
      rowRoles,
      rules: nextRules,
      cells,
      ruleLines: nextRules
        .filter((rule) => rule.line !== 'unknown')
        .map(({ axis: a, ord, line }) => ({ axis: a, ord, line })),
    },
  };
}

/** Evenly space interior row (or col) dividers between the outer frame edges. */
export function distributeTableAxis(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  axis: 'row' | 'col'
): TableGridDraft {
  const rules = cloneRules(choice.rules ?? table.rules);
  const axisList = axisRules(rules, axis);
  if (axisList.length < 3) {
    return { choice, rules: table.rules, cells: choice.cells ?? table.cells };
  }
  const first = axisList[0];
  const last = axisList[axisList.length - 1];
  if (!first || !last) {
    return { choice, rules: table.rules, cells: choice.cells ?? table.cells };
  }
  const span = last.pos - first.pos;
  const step = span / (axisList.length - 1);
  const nextAxis = axisList.map((rule, index) => ({
    ...rule,
    pos: first.pos + step * index,
  }));
  const other = rules.filter((rule) => rule.axis !== axis);
  const nextRules = [...other, ...nextAxis];
  return {
    rules: nextRules,
    cells: choice.cells ?? table.cells,
    choice: {
      ...choice,
      rules: nextRules,
      ruleLines: nextRules
        .filter((rule) => rule.line !== 'unknown')
        .map(({ axis: a, ord, line }) => ({ axis: a, ord, line })),
    },
  };
}

/** Build a CSV string from the current grid draft (locale: semicolon for de). */
export function tableDraftToCsv(
  table: DocumentRegionTableDto,
  choice: TableStructureChoice,
  separator = ';'
): string {
  const rules = choice.rules ?? table.rules;
  const cells = choice.cells ?? table.cells;
  const { rows, cols } = tableGridSize({ rules, cells });
  const lines: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    const values: string[] = [];
    for (let col = 0; col < cols; col += 1) {
      const cell = cells.find((item) => item.row === row && item.col === col);
      const text = (cell?.text ?? '').replaceAll('"', '""');
      values.push(`"${text}"`);
    }
    lines.push(values.join(separator));
  }
  return `${lines.join('\n')}\n`;
}

export function downloadTableCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
