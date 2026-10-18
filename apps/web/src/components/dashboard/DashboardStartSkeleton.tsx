// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

export function DashboardStartSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="dashboard-start-skeleton dv-page-grid" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">{t('dashboard.loading')}</span>
      <div className="dashboard-skeleton-header">
        <div className="dashboard-skeleton-line dashboard-skeleton-line-title" />
        <div className="dashboard-skeleton-line dashboard-skeleton-line-lead" />
      </div>
      <div className="dashboard-skeleton-banner" />
      <div className="dashboard-skeleton-row">
        <div className="dashboard-skeleton-card dashboard-skeleton-card-tall" />
        <div className="dashboard-skeleton-card dashboard-skeleton-card-tall" />
      </div>
      <div className="dashboard-skeleton-row">
        <div className="dashboard-skeleton-card dashboard-skeleton-card-list">
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
        </div>
        <div className="dashboard-skeleton-card dashboard-skeleton-card-list">
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
          <div className="dashboard-skeleton-list-row">
            <span className="dashboard-skeleton-circle" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-fill" />
            <span className="dashboard-skeleton-line dashboard-skeleton-line-short" />
          </div>
        </div>
      </div>
    </div>
  );
}
