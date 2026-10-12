// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrBlock, LayoutIrDocument, LayoutIrLine } from '@docuvate/contracts';

export type LayoutReadingBlockKind = 'heading' | 'paragraph';

export interface LayoutReadingBlock {
  id: string;
  page: number;
  kind: LayoutReadingBlockKind;
  level?: 1 | 2 | 3;
  text: string;
}

const LINE_Y_TOLERANCE = 0.018;
const HEADING_MIN_PT = 11;
const COLUMN_GAP_MIN = 0.08;

function linesForPage(doc: LayoutIrDocument, page: number): LayoutIrLine[] {
  const pageIr = doc.pages.find((p) => p.page === page);
  if (!pageIr) {
    return [];
  }
  if (pageIr.lines && pageIr.lines.length > 0) {
    return [...pageIr.lines].sort((a, b) => a.y - b.y || a.x - b.x);
  }
  return pageIr.blocks
    .filter((b) => b.text.trim())
    .map((block) => lineFromBlock(block))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function lineFromBlock(block: LayoutIrBlock): LayoutIrLine {
  return {
    page: block.page,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    text: block.text.trim(),
    fontSizePt: block.fontSizePt,
    weight: block.weight,
    align: block.align,
    blockIndex: block.blockIndex,
  };
}

function medianFontSize(lines: LayoutIrLine[]): number {
  const sizes = lines.map((l) => l.fontSizePt ?? 0).filter((n) => n > 0);
  if (sizes.length === 0) {
    return 10;
  }
  sizes.sort((a, b) => a - b);
  return sizes[Math.floor(sizes.length / 2)] ?? 10;
}

function headingLevel(line: LayoutIrLine, medianPt: number): 1 | 2 | 3 | null {
  const size = line.fontSizePt ?? 0;
  const bold = line.weight === 'bold';
  const text = line.text.trim();
  if (!text || text.length > 200) {
    return null;
  }
  if (size >= medianPt + 2 && bold) {
    return size >= medianPt + 4 ? 1 : 2;
  }
  if (size >= HEADING_MIN_PT && bold && text.length < 120) {
    return 3;
  }
  return null;
}

function clusterColumns(lines: LayoutIrLine[]): LayoutIrLine[][] {
  if (lines.length === 0) {
    return [];
  }
  const sorted = [...lines].sort((a, b) => a.x - b.x);
  const columns: LayoutIrLine[][] = [];
  for (const line of sorted) {
    const center = line.x + line.width / 2;
    const last = columns.at(-1);
    if (!last) {
      columns.push([line]);
      continue;
    }
    const lastCenter =
      last.reduce((sum, l) => sum + l.x + l.width / 2, 0) / last.length;
    if (Math.abs(center - lastCenter) >= COLUMN_GAP_MIN) {
      columns.push([line]);
    } else {
      last.push(line);
    }
  }
  for (const col of columns) {
    col.sort((a, b) => a.y - b.y || a.x - b.x);
  }
  return columns;
}

function mergeParagraphLines(lines: LayoutIrLine[]): string {
  return lines.map((l) => l.text.trim()).filter(Boolean).join(' ');
}

function readingBlocksForPage(doc: LayoutIrDocument, page: number): LayoutReadingBlock[] {
  const lines = linesForPage(doc, page);
  if (lines.length === 0) {
    return [];
  }
  const medianPt = medianFontSize(lines);
  const columns = clusterColumns(lines);
  const ordered =
    columns.length > 1
      ? columns.flatMap((col) => col)
      : [...lines].sort((a, b) => a.y - b.y || a.x - b.x);

  const blocks: LayoutReadingBlock[] = [];
  let paraLines: LayoutIrLine[] = [];

  const flushParagraph = () => {
    if (paraLines.length === 0) {
      return;
    }
    const text = mergeParagraphLines(paraLines);
    if (!text) {
      paraLines = [];
      return;
    }
    blocks.push({
      id: `p-${String(page)}-${String(blocks.length)}`,
      page,
      kind: 'paragraph',
      text,
    });
    paraLines = [];
  };

  for (const line of ordered) {
    const level = headingLevel(line, medianPt);
    if (level != null) {
      flushParagraph();
      blocks.push({
        id: `h-${String(page)}-${String(blocks.length)}`,
        page,
        kind: 'heading',
        level,
        text: line.text.trim(),
      });
      continue;
    }
    const last = paraLines.at(-1);
    if (last && Math.abs(last.y - line.y) > LINE_Y_TOLERANCE * 4) {
      flushParagraph();
    }
    paraLines.push(line);
  }
  flushParagraph();
  return blocks;
}

export function buildLayoutReadingBlocks(doc: LayoutIrDocument): LayoutReadingBlock[] {
  const out: LayoutReadingBlock[] = [];
  for (const page of doc.pages) {
    out.push(...readingBlocksForPage(doc, page.page));
  }
  return out;
}
