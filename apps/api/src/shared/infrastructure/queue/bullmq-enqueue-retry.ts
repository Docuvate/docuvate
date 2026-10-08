export type EnqueueRetryOptions = {
  maxAttempts: number;
  initialDelayMs?: number;
  label: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries BullMQ `queue.add` when Valkey is briefly unavailable (compose startup races). */
export async function enqueueBullJobWithRetry(
  add: () => Promise<unknown>,
  options: EnqueueRetryOptions
): Promise<void> {
  const initialDelayMs = options.initialDelayMs ?? 200;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      await add();
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= options.maxAttempts) {
        break;
      }
      const delay = Math.min(initialDelayMs * 2 ** (attempt - 1), 4_000);
      await sleep(delay);
    }
  }

  const detail =
    lastError instanceof Error ? lastError.message : lastError != null ? String(lastError) : 'unknown';
  throw new Error(`${options.label} enqueue failed after ${options.maxAttempts} attempts: ${detail}`);
}
