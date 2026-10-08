export function notifySaved(message?: string): void {
  const event = new CustomEvent('docuvate-notify-saved', { detail: { message } });
  window.dispatchEvent(event);
}

export function notifySaveError(message: string, retry?: () => void): void {
  const event = new CustomEvent('docuvate-notify-save-error', { detail: { message, retry } });
  window.dispatchEvent(event);
}
