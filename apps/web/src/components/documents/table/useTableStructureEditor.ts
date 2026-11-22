// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentRegionDto,
  DocumentRegionTableDto,
  DocumentRegionTableRuleLineDto,
} from '@docuvate/contracts';
import { tableGridSize, validTableStructure } from '@docuvate/contracts';
import { type Dispatch, type KeyboardEvent, type SetStateAction, useState } from 'react';

import {
  addedMerges,
  coalesceCellsForMerge,
  designTable,
  type GridSize,
  MAX_BAND_ROWS,
  mergeAt,
  type TableDesign,
  tableDesignOf,
  type TableRowKind,
  type TableStructureChoice,
  tableStructureOf,
  toggleTableMerge,
  withRowKind,
} from '../../../lib/tableLayouts';

interface Cell {
  row: number;
  col: number;
}

function sameStructure(a: TableStructureChoice, b: TableStructureChoice): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export interface TableStructureEditorState {
  region: DocumentRegionDto;
  table: DocumentRegionTableDto;
  index?: number;
  draft: TableStructureChoice;
  setDraft: Dispatch<SetStateAction<TableStructureChoice>>;
  design: TableDesign;
  setDesign: Dispatch<SetStateAction<TableDesign>>;
  saved: TableStructureChoice;
  moreOpen: boolean;
  setMoreOpen: Dispatch<SetStateAction<boolean>>;
  anchor: Cell | null;
  setAnchor: Dispatch<SetStateAction<Cell | null>>;
  extent: Cell | null;
  setExtent: Dispatch<SetStateAction<Cell | null>>;
  workingTable: DocumentRegionTableDto;
  grid: GridSize;
  dirty: boolean;
  valid: boolean;
  shape: GridSize & TableStructureChoice;
  lines: DocumentRegionTableRuleLineDto[];
  applyGridDraft: (next: { choice: TableStructureChoice }) => void;
  applyDesign: (next: TableDesign) => void;
  setRowKind: (row: number, kind: TableRowKind) => void;
  toggleMerge: () => void;
  onCellKeyDown: (event: KeyboardEvent<HTMLInputElement>, cell: Cell) => void;
  resetDraft: () => void;
  multi: boolean;
  anchorMerge: ReturnType<typeof mergeAt>;
  rangeEnd: Cell | null;
}

export function useTableStructureEditor(
  region: DocumentRegionDto,
  table: DocumentRegionTableDto
): TableStructureEditorState {
  const saved = tableStructureOf(table);
  const [draft, setDraft] = useState<TableStructureChoice>(saved);
  const [design, setDesign] = useState<TableDesign>(() => tableDesignOf(table));
  const [moreOpen, setMoreOpen] = useState(false);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [extent, setExtent] = useState<Cell | null>(null);

  const workingTable = {
    ...table,
    rules: draft.rules ?? table.rules,
    cells: draft.cells ?? table.cells,
  };
  const grid: GridSize = tableGridSize(workingTable);
  const dirty =
    !sameStructure(draft, saved) ||
    draft.ruleLines !== undefined ||
    draft.rules !== undefined ||
    draft.cells !== undefined;
  const shape = { ...grid, ...draft };
  const valid = validTableStructure(shape);
  const lines =
    draft.ruleLines ?? workingTable.rules.map(({ axis, ord, line }) => ({ axis, ord, line }));
  const rangeEnd = extent ?? anchor;
  const anchorMerge = anchor ? mergeAt(draft.merges, anchor.row, anchor.col) : null;
  const multi =
    anchor !== null &&
    rangeEnd !== null &&
    (anchor.row !== rangeEnd.row || anchor.col !== rangeEnd.col);

  function applyGridDraft(next: { choice: TableStructureChoice }) {
    setDraft(next.choice);
    setAnchor(null);
    setExtent(null);
  }

  function applyDesign(next: TableDesign) {
    setDesign(next);
    setDraft(designTable(next, grid, table.cells));
    setAnchor(null);
    setExtent(null);
  }

  function setRowKind(row: number, kind: TableRowKind) {
    const next = withRowKind(draft, grid, row, kind);
    setDraft(next);
    setDesign((prev) => ({
      ...prev,
      headerLevels: Math.min(next.headerRows, MAX_BAND_ROWS),
      footerRows: Math.min(next.footerRows, MAX_BAND_ROWS),
      grouped: next.rowRoles.length > 0,
    }));
  }

  function toggleMerge() {
    if (!anchor || !rangeEnd) return;
    const target = multi ? rangeEnd : anchor;
    const merges = multi
      ? toggleTableMerge(draft.merges, anchor, target)
      : anchorMerge
        ? draft.merges.filter((merge) => merge !== anchorMerge)
        : draft.merges;
    let cells = draft.cells ?? table.cells;
    for (const merge of addedMerges(draft.merges, merges)) {
      cells = coalesceCellsForMerge(cells, merge);
    }
    setDraft({ ...draft, merges, cells });
    setExtent(null);
  }

  function onCellKeyDown(event: KeyboardEvent<HTMLInputElement>, cell: Cell) {
    if (!event.shiftKey || !event.altKey) return;
    const from = extent ?? cell;
    const step = new Map<string, Cell>([
      ['ArrowRight', { row: from.row, col: Math.min(grid.cols - 1, from.col + 1) }],
      ['ArrowLeft', { row: from.row, col: Math.max(0, from.col - 1) }],
      ['ArrowDown', { row: Math.min(grid.rows - 1, from.row + 1), col: from.col }],
      ['ArrowUp', { row: Math.max(0, from.row - 1), col: from.col }],
    ]);
    const next = step.get(event.key);
    if (!next) return;
    event.preventDefault();
    if (!anchor) setAnchor(cell);
    setExtent(next);
  }

  function resetDraft() {
    setDraft(saved);
    setDesign(tableDesignOf(table));
    setAnchor(null);
    setExtent(null);
  }

  return {
    region,
    table,
    draft,
    setDraft,
    design,
    setDesign,
    saved,
    moreOpen,
    setMoreOpen,
    anchor,
    setAnchor,
    extent,
    setExtent,
    workingTable,
    grid,
    dirty,
    valid,
    shape,
    lines,
    applyGridDraft,
    applyDesign,
    setRowKind,
    toggleMerge,
    onCellKeyDown,
    resetDraft,
    multi,
    anchorMerge,
    rangeEnd,
  };
}