import type { KlmOperator, KlmTaskResult } from './types.js';

/** Card, Moran & Newell (1983) operator durations in milliseconds. */
export const KLM_OPERATOR_MS: Record<KlmOperator, number> = {
  K: 200,
  P: 1100,
  B: 100,
  H: 400,
  M: 1350,
};

export const KLM_CITATION =
  'Card, S. K., Moran, T. P., & Newell, A. (1983). The Psychology of Human-Computer Interaction. Lawrence Erlbaum Associates.';

export function predictKlmTimeMs(operators: KlmOperator[]): number {
  return operators.reduce((sum, op) => sum + KLM_OPERATOR_MS[op], 0);
}

export function countKlmStats(operators: KlmOperator[]): {
  clicks: number;
  keystrokes: number;
  pointerKeyboardSwitches: number;
} {
  let clicks = 0;
  let keystrokes = 0;
  let switches = 0;
  let lastPointerLike: 'pointer' | 'keyboard' | null = null;

  for (const op of operators) {
    if (op === 'B') {
      clicks += 1;
    }
    if (op === 'K') {
      keystrokes += 1;
    }
    const kind = op === 'K' || op === 'H' ? 'keyboard' : op === 'M' ? null : 'pointer';
    if (kind && lastPointerLike && lastPointerLike !== kind) {
      switches += 1;
    }
    if (kind) {
      lastPointerLike = kind;
    }
    if (op === 'M') {
      lastPointerLike = null;
    }
  }

  return { clicks, keystrokes, pointerKeyboardSwitches: switches };
}

export function buildKlmTaskResult(
  taskId: string,
  label: string,
  operators: KlmOperator[]
): KlmTaskResult {
  const stats = countKlmStats(operators);
  return {
    taskId,
    label,
    operators,
    predictedTimeMs: predictKlmTimeMs(operators),
    ...stats,
  };
}
