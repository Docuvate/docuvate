// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export interface LayoutHtmlRenderResult {
  html: string;
  reconstructionReliable: boolean;
  unreliableReason: string | null;
}

export interface LayoutTypstRenderResult {
  typst: string;
  reconstructionReliable: boolean;
  unreliableReason: string | null;
}
