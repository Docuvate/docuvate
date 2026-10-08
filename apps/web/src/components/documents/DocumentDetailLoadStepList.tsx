import { useTranslation } from 'react-i18next';
import {
  DOCUMENT_DETAIL_LOAD_STEPS,
  type DocumentDetailLoadStepId,
} from '../../lib/documentDetailLoadingSteps';
interface DocumentDetailLoadStepListProps {
  activeStep: DocumentDetailLoadStepId;
  /** Steps before activeStep are shown as complete when metadata/preview flags are known. */
  metadataReady?: boolean;
  previewReady?: boolean;
  compact?: boolean;
}

function stepState(
  stepId: DocumentDetailLoadStepId,
  activeStep: DocumentDetailLoadStepId,
  metadataReady: boolean,
  previewReady: boolean
): 'done' | 'active' | 'upcoming' {
  const order: DocumentDetailLoadStepId[] = ['metadata', 'preview', 'pipeline'];
  const stepIndex = order.indexOf(stepId);
  const activeIndex = order.indexOf(activeStep);
  if (stepIndex < activeIndex) {
    return 'done';
  }
  if (stepIndex === activeIndex) {
    return 'active';
  }
  if (stepId === 'metadata' && metadataReady) {
    return 'done';
  }
  if (stepId === 'preview' && previewReady) {
    return 'done';
  }
  return 'upcoming';
}

export function DocumentDetailLoadStepList({
  activeStep,
  metadataReady = false,
  previewReady = false,
  compact = false,
}: DocumentDetailLoadStepListProps) {
  const { t } = useTranslation();

  return (
    <ol
      className={`doc-load-steps${compact ? ' doc-load-steps-compact' : ''}`}
      aria-label={t('documents.loadingStepsAria')}
    >
      {DOCUMENT_DETAIL_LOAD_STEPS.map((step) => {
        const state = stepState(step.id, activeStep, metadataReady, previewReady);
        return (
          <li
            key={step.id}
            className={`doc-load-step doc-load-step-${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className="doc-load-step-marker" aria-hidden>
              {state === 'done' ? '✓' : state === 'active' ? '' : '·'}
            </span>
            <span className="doc-load-step-label">{t(step.labelKey)}</span>
          </li>
        );
      })}
    </ol>
  );
}
