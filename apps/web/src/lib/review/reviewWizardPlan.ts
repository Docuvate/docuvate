// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  DocumentReviewFieldSuggestionDto,
  DocumentReviewQueueItemDto,
  TagSuggestionDto,
} from '@docuvate/contracts';

export type ReviewWizardStepKind = 'labels' | 'fields' | 'date' | 'duplicates' | 'done';

export interface ReviewWizardSuggestionTask {
  id: string;
  documentId: string;
  documentTitle: string;
  stepKind: ReviewWizardStepKind;
  stepIndex: number;
  suggestionIndex: number;
  suggestionCount: number;
  labelSuggestion?: TagSuggestionDto;
  fieldSuggestion?: DocumentReviewFieldSuggestionDto;
  suggestedDocumentDate?: string | null;
}

export interface ReviewWizardDocumentSteps {
  documentId: string;
  documentTitle: string;
  steps: ReviewWizardStepKind[];
}

export interface ReviewWizardPlan {
  documents: ReviewWizardDocumentSteps[];
  tasks: ReviewWizardSuggestionTask[];
}

function displayTitle(item: DocumentReviewQueueItemDto): string {
  const title = item.title.trim();
  return title.length > 0 ? title : item.filename;
}

function stepsForItem(item: DocumentReviewQueueItemDto): ReviewWizardStepKind[] {
  const steps: ReviewWizardStepKind[] = [];
  if (item.labelSuggestions.length > 0) steps.push('labels');
  if (item.fieldSuggestions.length > 0) steps.push('fields');
  if (item.suggestedDocumentDate) steps.push('date');
  if (item.duplicateStack?.pendingReview) steps.push('duplicates');
  return steps;
}

export function buildReviewWizardPlan(items: DocumentReviewQueueItemDto[]): ReviewWizardPlan {
  const documents: ReviewWizardDocumentSteps[] = items.map((item) => ({
    documentId: item.documentId,
    documentTitle: displayTitle(item),
    steps: stepsForItem(item),
  }));

  const tasks: ReviewWizardSuggestionTask[] = [];
  for (const item of items) {
    const title = displayTitle(item);
    const steps = stepsForItem(item);
    steps.forEach((stepKind, stepIndex) => {
      if (stepKind === 'labels') {
        item.labelSuggestions.forEach((labelSuggestion, suggestionIndex) => {
          tasks.push({
            id: `${item.documentId}:label:${labelSuggestion.tag.id}`,
            documentId: item.documentId,
            documentTitle: title,
            stepKind,
            stepIndex,
            suggestionIndex,
            suggestionCount: item.labelSuggestions.length,
            labelSuggestion,
          });
        });
        return;
      }
      if (stepKind === 'fields') {
        item.fieldSuggestions.forEach((fieldSuggestion, suggestionIndex) => {
          tasks.push({
            id: `${item.documentId}:field:${fieldSuggestion.key}`,
            documentId: item.documentId,
            documentTitle: title,
            stepKind,
            stepIndex,
            suggestionIndex,
            suggestionCount: item.fieldSuggestions.length,
            fieldSuggestion,
          });
        });
        return;
      }
      if (stepKind === 'date') {
        tasks.push({
          id: `${item.documentId}:date`,
          documentId: item.documentId,
          documentTitle: title,
          stepKind,
          stepIndex,
          suggestionIndex: 0,
          suggestionCount: 1,
          suggestedDocumentDate: item.suggestedDocumentDate,
        });
        return;
      }
      if (stepKind === 'duplicates') {
        tasks.push({
          id: `${item.documentId}:duplicates`,
          documentId: item.documentId,
          documentTitle: title,
          stepKind,
          stepIndex,
          suggestionIndex: 0,
          suggestionCount: 1,
        });
      }
    });
  }

  return { documents, tasks };
}

export function reviewWizardProgress(plan: ReviewWizardPlan, taskIndex: number): {
  documentIndex: number;
  documentCount: number;
  taskIndex: number;
  taskCount: number;
} {
  const taskCount = plan.tasks.length;
  const documentCount = plan.documents.length;
  if (taskCount === 0 || taskIndex < 0) {
    return { documentIndex: 0, documentCount, taskIndex: 0, taskCount };
  }
  const task = plan.tasks[taskIndex] ?? plan.tasks[0];
  const documentIndex = plan.documents.findIndex((d) => d.documentId === task.documentId);
  return {
    documentIndex: documentIndex >= 0 ? documentIndex : 0,
    documentCount,
    taskIndex,
    taskCount,
  };
}
