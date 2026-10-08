/** User correction of an extracted field value — training signal for pipeline re-finetune. */
export interface ExtractionFieldCorrectionEntity {
  id: string;
  userId: string;
  documentId: string;
  fieldKey: string;
  oldValue: string;
  newValue: string;
  /** Tag ids assigned on the document when the correction was saved. */
  labelTagIds: string[];
  /** Label-scoped field storage (`label:{tagId}:…`) when applicable. */
  fieldTagId: string | null;
  source: 'user_correction';
  createdAt: Date;
}
