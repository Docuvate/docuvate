import type { KlmOperator } from '../metrics/types.js';

export interface UxTaskDefinition {
  id: string;
  label: string;
  klmOperators: KlmOperator[];
}

/** Keystroke-level models (Card/Moran/Newell). M placement follows KLM-R rules in docs. */
export const UX_TASK_DEFINITIONS: UxTaskDefinition[] = [
  {
    id: 'upload-document',
    label: 'Upload a document',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'K', 'P', 'B'],
  },
  {
    id: 'open-document',
    label: 'Open a document from the library',
    klmOperators: ['M', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'assign-label',
    label: 'Assign a label on document detail',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'K', 'P', 'B'],
  },
  {
    id: 'create-label',
    label: 'Create a label in structure',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'K', 'K', 'P', 'B'],
  },
  {
    id: 'create-recognized-field',
    label: 'Create a recognized field',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'K', 'K', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'change-confidence-save',
    label: 'Change confidence threshold and save',
    klmOperators: ['M', 'P', 'B', 'P', 'B', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'folder-create-move',
    label: 'Create folder and move a document',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'P', 'B', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'search',
    label: 'Global search',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'K', 'K', 'K'],
  },
  {
    id: 'switch-theme',
    label: 'Switch theme',
    klmOperators: ['M', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'change-setting-save',
    label: 'Change a setting and save',
    klmOperators: ['M', 'P', 'B', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'recognized-fields-save-bar',
    label: 'Save Erkannte Felder via SaveBar',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'search-palette-open-result',
    label: 'Open global search palette and pick a result',
    klmOperators: ['M', 'H', 'K', 'P', 'B', 'P', 'B'],
  },
  {
    id: 'document-title-save',
    label: 'Change document title and save',
    klmOperators: ['M', 'P', 'B', 'H', 'K', 'K', 'K', 'P', 'B'],
  },
];
