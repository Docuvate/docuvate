// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument, LayoutIrPageSummary } from '@docuvate/contracts';

export function layoutIrDocumentFromPageSummaries(pages: LayoutIrPageSummary[]): LayoutIrDocument {
  return {
    version: 1,
    pages: pages.map((p) => ({
      page: p.page,
      widthPt: p.widthPt,
      heightPt: p.heightPt,
      blocks: [],
    })),
  };
}
