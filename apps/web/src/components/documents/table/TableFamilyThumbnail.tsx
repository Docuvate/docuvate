// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TableFamily } from '../../../lib/tableLayouts';
import { familyDesign } from '../../../lib/tableLayouts';

interface TableFamilyThumbnailProps {
  family: TableFamily;
  title: string;
  hint: string;
}

/** Tiny CSS/SVG schematic of a table family — no static assets. */
export function TableFamilyThumbnail({ family, title, hint }: TableFamilyThumbnailProps) {
  const design = familyDesign(family);
  const rows = Math.max(3, design.headerLevels + 2 + design.footerRows + (design.grouped ? 1 : 0));
  const cols = design.index === 'both' ? 4 : design.index === 'none' ? 3 : 4;
  const cells: { r: number; c: number; kind: string }[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      let kind = 'body';
      if (r < design.headerLevels) kind = 'header';
      else if (r >= rows - design.footerRows) kind = 'footer';
      else if (design.grouped && r === design.headerLevels) kind = 'section';
      else if (design.index !== 'none' && (c === 0 || (design.index === 'both' && c === cols - 1))) {
        kind = 'index';
      }
      cells.push({ r, c, kind });
    }
  }
  const cellW = 18;
  const cellH = 10;
  const width = cols * cellW + 2;
  const height = rows * cellH + 2;
  return (
    <span className="table-family-option" data-family={family}>
      <svg
        className="table-family-thumb"
        width={width}
        height={height}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        aria-hidden
      >
        {cells.map((cell) => (
          <rect
            key={`${String(cell.r)}-${String(cell.c)}`}
            x={1 + cell.c * cellW}
            y={1 + cell.r * cellH}
            width={cellW - 1}
            height={cellH - 1}
            className={`table-family-cell table-family-cell--${cell.kind}`}
            rx={1}
          />
        ))}
      </svg>
      <span className="table-family-copy">
        <span className="table-family-title">{title}</span>
        <span className="table-family-hint muted">{hint}</span>
      </span>
    </span>
  );
}
