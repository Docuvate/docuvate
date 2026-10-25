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
    seedDocumentIndices: number[];
  }): Promise<CeLabelPropagationScoreRow[]>;
}

export interface MissingLabelHintPort {
  scoreMissingLabelHint(input: {
    exampleTokenSets: string[][];
    words: { text: string; box: [number, number, number, number] }[];
    pageWidth: number;
    pageHeight: number;
  }): Promise<{ score: number; show: boolean }>;
}
