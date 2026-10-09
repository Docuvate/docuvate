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
