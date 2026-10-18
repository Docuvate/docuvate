// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Link2, Lock, Sparkles, Upload } from 'lucide-react';
import { useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { resolveLibraryDropTarget } from '../../lib/documentUploadAssignment';
import { UPLOAD_ACCEPT } from '../../lib/documentUploadConstants';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DocumentUploadProvider, useDocumentUploadContext } from '../upload/DocumentUploadProvider';
import { UploadDropzone } from '../UploadDropzone';

function OnboardingUploadButton() {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { dropTarget, enqueueFiles } = useDocumentUploadContext();

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className="dashboard-onboarding-step-btn"
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {t('upload.chooseFiles')}
      </Button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        className="visually-hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            enqueueFiles(event.target.files, dropTarget.assignment);
            event.target.value = '';
          }
        }}
      />
    </>
  );
}

export function DashboardOnboarding() {
  const { t } = useTranslation();

  return (
    <DocumentUploadProvider
      dropTarget={resolveLibraryDropTarget({
        mode: 'all',
        filters: {},
        folders: [],
      })}
    >
      <div className="dashboard-onboarding">
        <header className="dashboard-onboarding-header">
          <h1 className="dashboard-onboarding-title">{t('dashboard.onboarding.title')}</h1>
          <p className="dashboard-onboarding-lead">{t('dashboard.onboarding.lead')}</p>
        </header>
        <div className="dashboard-onboarding-steps">
          <Card className="dashboard-onboarding-step dashboard-onboarding-step-active">
            <div className="dashboard-onboarding-step-icon dashboard-onboarding-step-icon-active">
              <Upload size={20} aria-hidden />
            </div>
            <h2 className="dashboard-onboarding-step-title">{t('dashboard.onboarding.stepUploadTitle')}</h2>
            <p className="dashboard-onboarding-step-text">{t('dashboard.onboarding.stepUploadText')}</p>
            <OnboardingUploadButton />
          </Card>
          <Card className="dashboard-onboarding-step">
            <div className="dashboard-onboarding-step-icon">
              <Sparkles size={20} aria-hidden />
            </div>
            <h2 className="dashboard-onboarding-step-title">{t('dashboard.onboarding.stepReviewTitle')}</h2>
            <p className="dashboard-onboarding-step-text">{t('dashboard.onboarding.stepReviewText')}</p>
            <Button type="button" variant="secondary" disabled className="dashboard-onboarding-step-btn">
              {t('dashboard.onboarding.stepReviewPending')}
            </Button>
          </Card>
          <Card className="dashboard-onboarding-step">
            <div className="dashboard-onboarding-step-icon">
              <Link2 size={20} aria-hidden />
            </div>
            <h2 className="dashboard-onboarding-step-title">{t('dashboard.onboarding.stepConnectTitle')}</h2>
            <p className="dashboard-onboarding-step-text">{t('dashboard.onboarding.stepConnectText')}</p>
            <Link
              to={routes.settingsConnectors}
              className="btn btn-secondary dashboard-onboarding-step-btn"
            >
              {t('dashboard.onboarding.stepConnectAction')}
            </Link>
          </Card>
        </div>
        <div className="dashboard-onboarding-dropzone">
          <UploadDropzone compact={false} />
        </div>
        <p className="dashboard-onboarding-footnote">
          <Lock size={14} aria-hidden />
          <span>{t('dashboard.onboarding.privacyNote')}</span>
        </p>
      </div>
    </DocumentUploadProvider>
  );
}
