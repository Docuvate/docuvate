// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FIELD_ACCEPTANCE_LABEL_CONFIDENCE, type TagDto } from '@docuvate/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useToastNotify } from '../../components/save/ToastProvider';
import { RecognizedFieldCatalogEditor } from '../../components/settings/RecognizedFieldCatalogEditor';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { getWorkspaceMlSettings, listRecognizedFields, listTags } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import {
  draftsFromRecognizedDefinitions,
  type RecognizedFieldDraft,
  type RecognizedFieldGateDraft,
} from '../../lib/recognizedFieldDraft';
import { validateRecognizedFieldDrafts } from '../../lib/recognizedFieldRules';
import { persistRecognizedFieldCatalog } from '../../lib/recognizedFieldsPersist';
import { routes } from '../../lib/routes';
import { notifySaveError } from '../../lib/saveNotify';

export function RecognizedFieldsPage() {
  const { t } = useTranslation();
  const { pushSuccess } = useToastNotify();
  const [fields, setFields] = useState<RecognizedFieldDraft[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [gateBaseline, setGateBaseline] = useState<RecognizedFieldGateDraft>({
    confidenceGateEnabled: true,
    labelFieldConfidenceThreshold: FIELD_ACCEPTANCE_LABEL_CONFIDENCE.normal,
  });
  const [loading, setLoading] = useState(true);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    void Promise.all([listRecognizedFields(), listTags(), getWorkspaceMlSettings()])
      .then(([recognized, tagList, workspaceMl]) => {
        const defaults: RecognizedFieldGateDraft = {
          confidenceGateEnabled: true,
          labelFieldConfidenceThreshold:
            FIELD_ACCEPTANCE_LABEL_CONFIDENCE[workspaceMl.fieldAcceptance],
        };
        const nextFields = draftsFromRecognizedDefinitions(recognized, defaults);
        setGateBaseline(defaults);
        setFields(nextFields);
        setTags(tagList);
      })
      .catch((err: unknown) => {
        setLoadError(formatUserFacingError(err, 'recognizedFields.loadFailed'));
      })
      .finally(() => { setLoading(false); });
  }, []);

  const validationMessages = useMemo(
    () => ({
      missingLabel: (position: number) =>
        t('recognizedFields.validationMissingLabel', { position }),
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

  return (
    <div className="page library-page recognized-fields-page" data-ux="page">
      <PageHeader
        className="recognized-fields-header"
        title={t('recognizedFields.pageTitle')}
        description={t('recognizedFields.pageLead')}
      />

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
        </div>
      ) : null}
    </div>
  );
}
