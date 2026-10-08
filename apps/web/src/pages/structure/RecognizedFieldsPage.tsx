import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatUserFacingError } from '../../lib/apiErrors';
import type { TagDto } from '@docuvate/contracts';
import { getUserSettings, listRecognizedFields, listTags, updateUserSettings } from '../../lib/api';
import { RecognizedFieldCatalogEditor } from '../../components/settings/RecognizedFieldCatalogEditor';
import {
  RecognizedFieldQualityGateEditor,
  type RecognizedFieldGateDraft,
} from '../../components/settings/RecognizedFieldQualityGateEditor';
import { draftsFromRecognizedDefinitions, type RecognizedFieldDraft } from '../../lib/recognizedFieldDraft';
import { validateRecognizedFieldDrafts } from '../../lib/recognizedFieldRules';
import { persistRecognizedFieldCatalog } from '../../lib/recognizedFieldsPersist';
import { routes } from '../../lib/routes';
import { Card } from '../../components/ui/Card';
import { useFormDraft } from '../../lib/useFormDraft';
import { PageFormSaveKit } from '../../components/save/PageFormSaveKit';
import { useToastNotify } from '../../components/save/ToastProvider';
import { notifySaved, notifySaveError } from '../../lib/saveNotify';

export function RecognizedFieldsPage() {
  const { t } = useTranslation();
  const { pushSuccess } = useToastNotify();
  const [fields, setFields] = useState<RecognizedFieldDraft[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [gateBaseline, setGateBaseline] = useState<RecognizedFieldGateDraft>({
    confidenceGateEnabled: true,
    labelFieldConfidenceThreshold: 0.62,
    requiredLabelIds: [],
  });
  const gateForm = useFormDraft(gateBaseline);
  const [loading, setLoading] = useState(true);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [gateSaving, setGateSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gateSaveError, setGateSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    void Promise.all([listRecognizedFields(), listTags(), getUserSettings()])
      .then(([recognized, tagList, settings]) => {
        const defaults: RecognizedFieldGateDraft = {
          confidenceGateEnabled: true,
          labelFieldConfidenceThreshold: settings.labelFieldConfidenceThreshold ?? 0.62,
          requiredLabelIds: settings.fieldExtractionRequiredLabelIds ?? [],
        };
        const nextFields = draftsFromRecognizedDefinitions(recognized, defaults);
        setGateBaseline(defaults);
        setFields(nextFields);
        setTags(tagList);
      })
      .catch((err: unknown) => {
        setLoadError(formatUserFacingError(err, 'recognizedFields.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, []);

  const validationMessages = useMemo(
    () => ({
      missingLabel: (position: number) => t('recognizedFields.validationMissingLabel', { position }),
      missingKey: (label: string) => t('recognizedFields.validationMissingKey', { label }),
      labelsRequired: (label: string) => t('recognizedFields.validationLabelsRequired', { label }),
    }),
    [t]
  );

  const persistCatalog = useCallback(
    async (nextFields: RecognizedFieldDraft[]): Promise<boolean> => {
      const validation = validateRecognizedFieldDrafts(nextFields, validationMessages);
      setValidationErrors(validation);
      if (validation.length > 0) {
        return false;
      }

      setCatalogBusy(true);
      setLoadError(null);
      try {
        const saved = await persistRecognizedFieldCatalog(nextFields, gateBaseline);
        setFields(saved);
        setValidationErrors([]);
        pushSuccess();
        return true;
      } catch (err) {
        const message = formatUserFacingError(err, 'recognizedFields.saveFailed');
        setLoadError(message);
        notifySaveError(message, () => void persistCatalog(nextFields));
        return false;
      } finally {
        setCatalogBusy(false);
      }
    },
    [gateBaseline, pushSuccess, validationMessages]
  );

  async function saveGateDefaults() {
    setGateSaving(true);
    setGateSaveError(null);
    try {
      await updateUserSettings({
        fieldExtractionConfidenceGateEnabled: true,
        labelFieldConfidenceThreshold: gateForm.draft.labelFieldConfidenceThreshold,
        fieldExtractionRequiredLabelIds: gateForm.draft.requiredLabelIds,
      });
      setGateBaseline(gateForm.draft);
      gateForm.commit(gateForm.draft);
      notifySaved();
    } catch (err) {
      const message = formatUserFacingError(err, 'recognizedFields.saveFailed');
      setGateSaveError(message);
      notifySaveError(message, () => void saveGateDefaults());
    } finally {
      setGateSaving(false);
    }
  }

  return (
    <div className="page library-page recognized-fields-page page--with-save-bar">
      <header className="page-header recognized-fields-header">
        <div>
          <h1>{t('recognizedFields.pageTitle')}</h1>
          <p className="muted">{t('recognizedFields.pageLead')}</p>
        </div>
      </header>

      {loadError ? (
        <p className="error" role="alert">
          {loadError}
        </p>
      ) : null}

      {validationErrors.length > 0 ? (
        <ul className="recognized-fields-validation error" role="alert">
          {validationErrors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      {loading ? <p className="muted">{t('recognizedFields.loading')}</p> : null}

      {!loading ? (
        <div className="recognized-fields-layout">
          <Card className="recognized-fields-catalog-card">
            <h2>{t('recognizedFields.catalogTitle')}</h2>
            <RecognizedFieldCatalogEditor
              fields={fields}
              tags={tags}
              gateDefaults={gateBaseline}
              catalogBusy={catalogBusy}
              onPersistFields={persistCatalog}
            />
            <p className="muted settings-hint recognized-fields-labels-link">
              {t('recognizedFields.labelsHint')}{' '}
              <Link to={routes.structureLabels}>{t('nav.labels')}</Link>.
            </p>
          </Card>

          <Card className="recognized-fields-defaults-card">
            <h2>{t('recognizedFields.defaultsTitle')}</h2>
            <p className="muted recognized-fields-defaults-lead">{t('recognizedFields.defaultsLead')}</p>
            <RecognizedFieldQualityGateEditor
              tags={tags}
              gate={gateForm.draft}
              disabled={gateSaving}
              onChange={gateForm.setDraft}
            />
          </Card>
        </div>
      ) : null}

      <PageFormSaveKit
        dirty={gateForm.dirty}
        saving={gateSaving}
        error={gateSaveError}
        onDiscard={gateForm.discard}
        onSave={() => void saveGateDefaults()}
      />
    </div>
  );
}
