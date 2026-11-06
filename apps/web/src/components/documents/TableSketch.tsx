// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionTableRuleLineDto, TableRuleLine } from '@docuvate/contracts';
import { isTableIndexCol, tableRowBand } from '@docuvate/contracts';

import { type GridSize, mergeAt, type TableStructureChoice } from '../../lib/tableLayouts';

const CELL_W = 12;
const CELL_H = 8;

type Structure = Pick<
  TableStructureChoice,
  | 'headerRows'
  | 'footerRows'
  | 'headerCols'
  | 'trailingHeaderCols'
  | 'banded'
  | 'rowRoles'
  | 'merges'
>;

interface TableSketchProps {
  grid: GridSize;
  structure: Structure;
  /** Line per rule; missing rules count as unknown and are drawn faint. */
  lines: readonly DocumentRegionTableRuleLineDto[];
  className?: string;
}

interface Segment {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  line: TableRuleLine;
}

function cellTone(grid: GridSize, structure: Structure, row: number, col: number): string {
  const shape = { ...grid, ...structure };
  const band = tableRowBand(shape, row);
  if (band === 'header') return 'header';
  if (band === 'footer') return 'footer';
  const role = structure.rowRoles.find((entry) => entry.row === row)?.role;
  if (role) return role;
  if (isTableIndexCol(shape, col)) return 'index';
  return structure.banded && (row - structure.headerRows) % 2 === 1 ? 'band' : 'body';
}

/** Rule segments between cells, skipping edges hidden inside a merged cell. */
function segments(
  grid: GridSize,
  structure: Structure,
  lines: readonly DocumentRegionTableRuleLineDto[]
): Segment[] {
  const lineOf = (axis: 'row' | 'col', ord: number): TableRuleLine =>
    lines.find((entry) => entry.axis === axis && entry.ord === ord)?.line ?? 'unknown';
  const out: Segment[] = [];
  for (let ord = 0; ord <= grid.rows; ord += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const above = ord > 0 ? mergeAt(structure.merges, ord - 1, col) : null;
      if (above && ord < above.row0 + above.rowSpan) continue;
      const y = ord * CELL_H;
      out.push({
        key: `r${String(ord)}:${String(col)}`,
        x1: col * CELL_W,
        y1: y,
        x2: (col + 1) * CELL_W,
        y2: y,
        line: lineOf('row', ord),
      });
    }
  }
  for (let ord = 0; ord <= grid.cols; ord += 1) {
    for (let row = 0; row < grid.rows; row += 1) {
      const left = ord > 0 ? mergeAt(structure.merges, row, ord - 1) : null;
      if (left && ord < left.col0 + left.colSpan) continue;
      const x = ord * CELL_W;
      out.push({
        key: `c${String(ord)}:${String(row)}`,
        x1: x,
        y1: row * CELL_H,
        x2: x,
        y2: (row + 1) * CELL_H,
        line: lineOf('col', ord),
      });
    }
  }
  return out.filter((segment) => segment.line !== 'none');
}

/**
 * Schematic preview generated from the structure itself: bands and roles as tones, merged cells
 * as one area, and the ruling drawn per rule (thin, thick, double, or faint when unknown).
 */
export function TableSketch({ grid, structure, lines, className }: TableSketchProps) {
  const cells: { key: string; x: number; y: number; w: number; h: number; tone: string }[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const merge = mergeAt(structure.merges, row, col);
      if (merge && (merge.row0 !== row || merge.col0 !== col)) continue;
      cells.push({
        key: `${String(row)}:${String(col)}`,
        x: col * CELL_W,
        y: row * CELL_H,
        w: (merge?.colSpan ?? 1) * CELL_W,
        h: (merge?.rowSpan ?? 1) * CELL_H,
        tone: cellTone(grid, structure, row, col),
      });
    }
  }
  return (
    <svg
      className={`table-sketch${className ? ` ${className}` : ''}`}
      viewBox={`-2 -2 ${String(grid.cols * CELL_W + 4)} ${String(grid.rows * CELL_H + 4)}`}
      aria-hidden
      focusable="false"
    >
      {cells.map((cell) => (
        <rect
          key={cell.key}
          className={`table-sketch-cell table-sketch-cell--${cell.tone}`}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
        />
      ))}
      {segments(grid, structure, lines).map((segment) =>
        segment.line === 'double' ? (
          <g key={segment.key} className="table-sketch-line table-sketch-line--double">
            {[-0.8, 0.8].map((offset) => {
              const dx = segment.x1 === segment.x2 ? offset : 0;
              const dy = dx === 0 ? offset : 0;
              return (
                <line
                  key={offset}
                  x1={segment.x1 + dx}
                  y1={segment.y1 + dy}
                  x2={segment.x2 + dx}
                  y2={segment.y2 + dy}
                />
              );
            })}
          </g>
        ) : (
          <line
            key={segment.key}
            className={`table-sketch-line table-sketch-line--${segment.line}`}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
          />
        )
      )}
    </svg>
  );
}
