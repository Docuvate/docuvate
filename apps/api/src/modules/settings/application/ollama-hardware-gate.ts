// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Heuristic: block large Ollama models on CPU-only / low-VRAM hosts. */
/** 4B–8B Q4 models are treated as CPU-safe; gate from ~9B upward. */
const LARGE_MODEL_PATTERN = /(?:^|[/:_-])(9b|13b|14b|20b|30b|34b|70b|72b|405b)(?:$|[/:_-])/i;

const LARGE_MODEL_KEYWORDS = /\b(70b|405b|mixtral|llama-?3\.1|llama3\.1|qwen2\.5-72b)\b/i;

export function ollamaModelLikelyNeedsGpu(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (LARGE_MODEL_PATTERN.test(normalized)) {
    return true;
  }
  return LARGE_MODEL_KEYWORDS.test(normalized);
}

export function ollamaAvailableForHardware(
  model: string,
  hardware: { capabilities: { largeLocalLlm: boolean } } | null
): boolean {
  if (!hardware) {
    return true;
  }
  if (!ollamaModelLikelyNeedsGpu(model)) {
    return true;
  }
  return hardware.capabilities.largeLocalLlm;
}
