// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
function normalizeModelTag(name: string): string {
  return name.split(':')[0]?.trim().toLowerCase() ?? name.trim().toLowerCase();
}

/** True when Ollama reports the configured model tag (or same base name) as present. */
export async function isOllamaModelLoaded(
  ollamaUrl: string,
  model: string,
  timeoutMs = 4000
): Promise<boolean> {
  const target = model.trim().toLowerCase();
  if (!target) {
    return false;
  }
  const base = normalizeModelTag(target);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return false;
    }
    const data = (await response.json()) as { models?: Array<{ name?: string }> };
    const names = (data.models ?? [])
      .map((m) => m.name?.trim().toLowerCase())
      .filter((n): n is string => Boolean(n));
    return names.some(
      (name) => name === target || name.startsWith(`${base}:`) || normalizeModelTag(name) === base
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
