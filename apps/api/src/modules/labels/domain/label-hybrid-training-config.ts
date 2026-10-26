// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

function parsePositiveIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parseRatioEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

/** Debounce window before evaluating a hybrid retrain after the last revision change. */
export function labelHybridTrainDebounceMs(): number {
  return parsePositiveIntEnv('LABEL_HYBRID_TRAIN_DEBOUNCE_MS', 45_000);
}

/** Minimum confirmed labeled-example delta before retraining (absolute floor). */
export function labelHybridRetrainMinDelta(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_RETRAIN_MIN_DELTA', 5);
}

/** Minimum confirmed labeled-example delta as a fraction of the last trained corpus size. */
export function labelHybridRetrainMinDeltaRatio(): number {
  return parseRatioEnv('DOCUVATE_LABEL_RETRAIN_MIN_DELTA_RATIO', 0.02);
}

/** Minimum wall-clock gap between completed trainings for the same user. */
export function labelHybridRetrainMinIntervalMs(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_RETRAIN_MIN_INTERVAL_MS', 60_000);
}

/** Wall-clock budget for a single training run; exceeded runs abort and keep the prior model. */
export function labelHybridTrainBudgetMs(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_HYBRID_TRAIN_BUDGET_MS', 120_000);
}

/** Max labeled examples per tag used for hybrid training (stratified cap). */
export function labelHybridMaxExamplesPerTag(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_HYBRID_MAX_EXAMPLES_PER_TAG', 40);
}

/** Max total labeled examples per training run. */
export function labelHybridMaxTrainingExamples(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_HYBRID_MAX_TRAINING_EXAMPLES', 2_400);
}

/** Max distinct documents used to build TF-IDF vocabulary per train. */
export function labelHybridMaxVocabDocuments(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_HYBRID_MAX_VOCAB_DOCUMENTS', 400);
}

/** Characters of document text fed into hybrid TF-IDF features. */
export function labelHybridTextCharsForFeatures(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_HYBRID_TEXT_CHARS', 2_048);
}

/** Training epochs for large corpora (full 48 below this example count). */
export function labelHybridTrainEpochsForExampleCount(exampleCount: number): number {
  if (exampleCount <= 96) {
    return 48;
  }
  if (exampleCount <= 480) {
    return 24;
  }
  if (exampleCount <= 1_200) {
    return 12;
  }
  return 8;
}

/** Max prepared rows used for confidence calibration (subset of training set). */
export function labelHybridMaxCalibrationExamples(): number {
  return parsePositiveIntEnv('DOCUVATE_LABEL_HYBRID_MAX_CALIBRATION_EXAMPLES', 72);
}

export const LABEL_HYBRID_FAST_DEFAULT_THRESHOLD = 0.88;

export interface LabelHybridTrainRuntimeOptions {
  shouldAbort?: () => boolean;
  fastCalibration?: boolean;
}

/** Use exact leave-one-out calibration only up to this many training examples. */
export const LABEL_HYBRID_LOO_MAX_EXAMPLES = 72;

/** K-fold cross-conformal calibration fold count above the LOO threshold. */
export const LABEL_HYBRID_K_FOLD_COUNT = 10;
