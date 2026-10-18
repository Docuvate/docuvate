export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FittsSegment {
  from: Box;
  to: Box;
  fromHint: string;
  toHint: string;
  distance: number;
  effectiveWidth: number;
  indexOfDifficulty: number;
  predictedMovementTimeMs: number;
}

export interface FittsTaskResult {
  taskId: string;
  label: string;
  viewport: ViewportLabel;
  segments: FittsSegment[];
  sumIndexOfDifficulty: number;
  sumPredictedMovementTimeMs: number;
}

export type ViewportLabel = 'desktop' | 'mobile';

export interface ViewportSpec {
  label: ViewportLabel;
  width: number;
  height: number;
}

export type KlmOperator = 'K' | 'P' | 'B' | 'H' | 'M';

export interface KlmTaskResult {
  taskId: string;
  label: string;
  operators: KlmOperator[];
  predictedTimeMs: number;
  clicks: number;
  keystrokes: number;
  pointerKeyboardSwitches: number;
}

export interface TargetSizeFinding {
  route: string;
  selectorHint: string;
  role: string;
  name: string;
  box: Box;
  wcag258Pass: boolean;
  primaryHeightPass: boolean;
  isPrimaryControl: boolean;
  iconCentered: boolean | null;
  buttonGroupHeightMismatchPx: number | null;
}

export interface LayoutLandmarks {
  page: boolean;
  pageTitle: boolean;
  primaryAction: boolean;
}

export interface LayoutPageSnapshot {
  path: string;
  title: string;
  scope: 'customer' | 'dev';
  landmarks: LayoutLandmarks;
  containerLeft: number | null;
  containerMaxWidth: number | null;
  containerPaddingTop: number | null;
  titleY: number | null;
  titleFontSizePx: number | null;
  primaryActionX: number | null;
  primaryActionY: number | null;
  cardNestingDepth: number | null;
  gutterWidthPx: number | null;
}

export interface LayoutMissingLandmark {
  path: string;
  title: string;
  missing: Array<keyof LayoutLandmarks>;
}

export interface LayoutConsistencyReport {
  customerPages: LayoutPageSnapshot[];
  devPages: LayoutPageSnapshot[];
  missingLandmarks: LayoutMissingLandmark[];
  variance: {
    containerLeft: number;
    containerMaxWidth: number;
    containerPaddingTop: number;
    titleY: number;
    titleFontSizePx: number;
    primaryActionX: number;
    primaryActionY: number;
    cardNestingDepth: number;
    gutterWidthPx: number;
  };
  outliers: Array<{ metric: string; page: string; value: number; median: number }>;
}

export interface HickDecisionPoint {
  id: string;
  label: string;
  visibleChoices: number;
}

export interface StabilityReport {
  clsByInteraction: Record<string, number>;
  nestedScrollContainerCount: number;
}

export interface AxeViolationDetail {
  id: string;
  impact: string;
  description: string;
  route: string;
  nodeTargets: string[];
}

export interface AccessibilityReport {
  axeViolationCount: number;
  axeViolations: AxeViolationDetail[];
  lighthouseAccessibilityScore: number | null;
  lighthouseNote: string | null;
}

export interface UxMetricsReport {
  generatedAt: string;
  gitSha: string | null;
  webBase: string;
  seedEmail: string;
  viewports: ViewportSpec[];
  /** Fitts/KLM/CLS probes skipped (e.g. search palette until product ships). */
  skippedFittsTaskIds: string[];
  fitts: FittsTaskResult[];
  klm: KlmTaskResult[];
  targetSizes: Record<ViewportLabel, TargetSizeFinding[]>;
  layout: LayoutConsistencyReport;
  hick: HickDecisionPoint[];
  stability: StabilityReport;
  accessibility: AccessibilityReport;
}
