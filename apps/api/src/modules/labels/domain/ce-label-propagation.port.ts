// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

export interface CeLabelPropagationSeedPort {
  propagateAfterLabelSeed(
    userId: string,
    tagId: string,
    seedDocumentIds: string[]
  ): Promise<number>;
}

export interface CeLabelPropagationScoreRow {
  documentIndex: number;
  score: number;
  tier: 'auto_assign' | 'suggest' | 'none';
}

export interface CeLabelPropagationScoresPort {
  propagateLabelScores(input: {
    labelName: string;
    passageVectors: number[][];
    passageTexts: string[];
    seedDocumentIndices: number[];
    positiveDocumentIndices: number[];
    calibrationDocumentIndices: number[];
  }): Promise<CeLabelPropagationScoreRow[]>;
}

export interface MissingLabelCorpusDocument {
  documentIndex: number;
  embedding: number[];
  tagIds: string[];
  text: string;
}

export interface MissingLabelHintPort {
  scoreMissingLabelHint(input: {
    targetDocumentIndex: number;
    assignedTagIds: string[];
    corpus: MissingLabelCorpusDocument[];
    labeledDocumentIndices: number[];
  }): Promise<{ score: number; show: boolean }>;
  scoreMissingLabelHintsBatch(input: {
    targets: { targetDocumentIndex: number; assignedTagIds: string[] }[];
    corpus: MissingLabelCorpusDocument[];
    labeledDocumentIndices: number[];
  }): Promise<{ targetDocumentIndex: number; score: number; show: boolean }[]>;
}
