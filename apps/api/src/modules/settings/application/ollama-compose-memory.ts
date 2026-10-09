// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Rough minimum container mem_limit for loaded inference (GiB). */
const MODEL_MIN_GIB: Record<string, number> = {
  'qwen2.5:3b': 2.5,
  'llama3.2:3b': 2.5,
  'gemma3:4b': 4.5,
  'qwen3:4b': 5,
  'phi4-mini:3.8b-q4_K_M': 3.5,
  'qwen2.5:7b': 6,
};

export function parseMemLimitToGiB(raw: string | undefined | null): number | null {
  if (!raw?.trim()) {
    return null;
  }
  const normalized = raw.trim().toLowerCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)(g|m|b)?$/);
  if (!match) {
    return null;
  }
  const value = Number.parseFloat(match[1] ?? '0');
  const unit = match[2] ?? 'b';
  if (unit === 'g') {
    return value;
  }
  if (unit === 'm') {
    return value / 1024;
  }
  return value / (1024 * 1024 * 1024);
}

export function ollamaMemLimitGiBFromEnv(): number | null {
  return parseMemLimitToGiB(process.env['OLLAMA_MEM_LIMIT'] ?? '3g');
}

export function modelMinGiB(model: string): number {
  const tag = model.trim().toLowerCase();
  if (MODEL_MIN_GIB[tag] != null) {
    return MODEL_MIN_GIB[tag]!;
  }
  const base = tag.split(':')[0] ?? tag;
  return MODEL_MIN_GIB[base] ?? 3;
}

export function modelFitsOllamaMemLimit(model: string, limitGiB: number | null): boolean {
  if (limitGiB == null) {
    return true;
  }
  return limitGiB + 0.05 >= modelMinGiB(model);
}
