import type {
  ExtractedField,
  LayoutIrBlock,
  LayoutIrDocument,
  LayoutIrTable,
  LayoutIrWidget,
} from '@docuvate/contracts';

export type LayoutOverlayKind = 'heading' | 'field' | 'table' | 'text';

export interface LayoutOverlayRegion {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: LayoutOverlayKind;
  label: string;
  value?: string;
  blockIndex?: number;
  tableIndex?: number;
  rowIndex?: number;
  columnIndex?: number;
}

export interface LayoutOutlineEntry {
  id: string;
  page: number;
  title: string;
  level: 1 | 2 | 3;
  overlayId: string;
  y: number;
}

export interface LayoutTableView {
  tableIndex: number;
  page: number;
  title: string;
  columnCount: number;
  rows: string[][];
  overlayId: string;
}

const HEADING_MIN_PT = 11;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function boxFromBlock(block: LayoutIrBlock): Pick<LayoutOverlayRegion, 'x' | 'y' | 'width' | 'height'> {
  return {
    x: clamp01(block.x),
    y: clamp01(block.y),
    width: clamp01(block.width),
    height: clamp01(block.height),
  };
}

function classifyBlock(block: LayoutIrBlock): LayoutOverlayKind {
  const size = block.fontSizePt ?? 0;
  const bold = block.weight === 'bold';
  const text = block.text.trim();
  if (size >= HEADING_MIN_PT && bold && text.length > 0 && text.length < 120) {
    return 'heading';
  }
  return 'text';
}

function widgetLabel(widget: LayoutIrWidget): string {
  if (widget.fieldName?.trim()) return widget.fieldName.trim();
  return widget.kind === 'checkbox' ? 'checkbox' : 'field';
}

export function buildLayoutOverlays(doc: LayoutIrDocument): LayoutOverlayRegion[] {
  const regions: LayoutOverlayRegion[] = [];
  let tableIndex = 0;

  for (const page of doc.pages) {
    for (const table of page.tables ?? []) {
      const id = `table-${tableIndex}`;
      regions.push({
        id,
        page: table.page,
        x: clamp01(table.x),
        y: clamp01(table.y),
        width: clamp01(table.width),
        height: clamp01(table.height),
        kind: 'table',
        label: `Tabelle ${tableIndex + 1}`,
        tableIndex,
      });
      tableIndex += 1;
    }

    for (const widget of page.widgets ?? []) {
      const id = `widget-${widget.page}-${regions.length}`;
      regions.push({
        id,
        page: widget.page,
        x: clamp01(widget.x),
        y: clamp01(widget.y),
        width: clamp01(widget.width),
        height: clamp01(widget.height),
        kind: 'field',
        label: widgetLabel(widget),
        value: widget.value ?? (widget.checked ? '✓' : undefined),
      });
    }

    for (const block of page.blocks) {
      const kind = classifyBlock(block);
      const id = block.blockIndex != null ? `block-${block.blockIndex}` : `ir-${page.page}-${regions.length}`;
      regions.push({
        id,
        page: block.page,
        ...boxFromBlock(block),
        kind,
        label: block.text.trim().slice(0, 80),
        value: kind === 'text' ? block.text.trim() : undefined,
        blockIndex: block.blockIndex,
      });
    }
  }

  return regions;
}

export function buildLayoutOutline(
  doc: LayoutIrDocument,
  overlays: LayoutOverlayRegion[]
): LayoutOutlineEntry[] {
  const overlayByBlock = new Map<number, LayoutOverlayRegion>();
  for (const o of overlays) {
    if (o.blockIndex != null && o.kind === 'heading') {
      overlayByBlock.set(o.blockIndex, o);
    }
  }

  const entries: LayoutOutlineEntry[] = [];
  for (const page of doc.pages) {
    for (const block of page.blocks) {
      const size = block.fontSizePt ?? 0;
      const bold = block.weight === 'bold';
      const text = block.text.trim();
      if (!text || text.length > 160) continue;
      if (size < HEADING_MIN_PT && !bold) continue;
      const level: 1 | 2 | 3 = size >= 13 ? 1 : size >= 11 ? 2 : 3;
      const overlay =
        block.blockIndex != null ? overlayByBlock.get(block.blockIndex) : undefined;
      entries.push({
        id: `outline-${entries.length}`,
        page: block.page,
        title: text,
        level,
        overlayId: overlay?.id ?? `ir-${page.page}-${block.y}`,
        y: block.y,
      });
    }
  }
  return entries.sort((a, b) => a.page - b.page || a.y - b.y);
}

export function buildLayoutTables(
  doc: LayoutIrDocument,
  overlays: LayoutOverlayRegion[]
): LayoutTableView[] {
  const views: LayoutTableView[] = [];
  let tableIndex = 0;
  for (const page of doc.pages) {
    for (const table of page.tables ?? []) {
      const overlay = overlays.find((o) => o.tableIndex === tableIndex);
      views.push({
        tableIndex,
        page: table.page,
        title: `Tabelle ${tableIndex + 1}`,
        columnCount: table.columnCount,
        rows: tableRowsToStrings(table),
        overlayId: overlay?.id ?? `table-${tableIndex}`,
      });
      tableIndex += 1;
    }
  }
  return views;
}

function tableRowsToStrings(table: LayoutIrTable): string[][] {
  return table.rows.map((row) => row.map((cell) => cell.text.trim()));
}

export function overlayForExtractionBlock(
  overlays: LayoutOverlayRegion[],
  blockIndex: number
): LayoutOverlayRegion | undefined {
  return overlays.find((o) => o.blockIndex === blockIndex);
}

export function hitTestLayoutOverlay(
  overlays: LayoutOverlayRegion[],
  page: number,
  nx: number,
  ny: number
): LayoutOverlayRegion | undefined {
  return overlays.find(
    (o) =>
      o.page === page &&
      nx >= o.x &&
      nx <= o.x + o.width &&
      ny >= o.y &&
      ny <= o.y + o.height
  );
}

export function fieldSuggestionKeys(
  widgets: LayoutIrWidget[],
  knownFieldKeys: Set<string>,
  persistedFields: ExtractedField[]
): { key: string; label: string; value: string }[] {
  const persistedKeys = new Set(persistedFields.map((f) => f.key));
  const out: { key: string; label: string; value: string }[] = [];
  const seen = new Set<string>();
  for (const w of widgets) {
    const key = w.fieldName?.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (knownFieldKeys.has(key) || persistedKeys.has(key)) continue;
    const value = w.value?.trim() ?? '';
    if (!value) continue;
    out.push({ key, label: key, value });
  }
  return out;
}

export function allLayoutWidgets(doc: LayoutIrDocument): LayoutIrWidget[] {
  const widgets: LayoutIrWidget[] = [];
  for (const page of doc.pages) {
    for (const w of page.widgets ?? []) {
      widgets.push(w);
    }
  }
  return widgets;
}
