import type { SavedDocumentViewDto } from '@docuvate/contracts';

export const SAVED_VIEWS_CHANGED = 'docuvate:saved-views-changed';

export function notifySavedViewsChanged(view?: SavedDocumentViewDto): void {
  window.dispatchEvent(new CustomEvent<SavedDocumentViewDto | undefined>(SAVED_VIEWS_CHANGED, { detail: view }));
}
