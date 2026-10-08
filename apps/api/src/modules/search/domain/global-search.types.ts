import type { SearchHighlightSpan } from '@docuvate/contracts';

export interface DocumentSearchRow {
  id: string;
  title: string;
  filename: string;
  extractedText: string;
  folderPath: string | null;
  labelNames: string[];
  documentDate: string | null;
  updatedAt: string;
  snippetText: string;
  matchedFieldLabel: string | null;
  highlightSpans: SearchHighlightSpan[];
  snippetHighlightSpans: SearchHighlightSpan[];
  score: number;
}

export interface FolderSearchRow {
  id: string;
  name: string;
  path: string;
  documentCount: number;
  highlightSpans: SearchHighlightSpan[];
  score: number;
}

export interface LabelSearchRow {
  id: string;
  name: string;
  color: string | null;
  documentCount: number;
  highlightSpans: SearchHighlightSpan[];
  score: number;
}

export interface GlobalSearchRepositoryResult {
  documents: DocumentSearchRow[];
  folders: FolderSearchRow[];
  labels: LabelSearchRow[];
  expandedTerms: string[];
  documentTotal: number;
  folderTotal: number;
  labelTotal: number;
}
