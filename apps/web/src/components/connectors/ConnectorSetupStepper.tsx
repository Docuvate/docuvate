// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

export type ConnectorSetupStep = 'access' | 'selection';

export function ConnectorSetupStepper({ step }: { step: ConnectorSetupStep }) {
  const { t } = useTranslation();
  const steps: ConnectorSetupStep[] = ['access', 'selection'];
  return (
    <div className="connector-setup-stepper" role="list" aria-label={t('connectors.stepper.aria')}>
      {steps.map((id, index) => {
        const active = id === step;
        return (
          <span
            key={id}
            className={`connector-setup-stepper-part${active ? ' connector-setup-stepper-part--active' : ''}`}
            role="listitem"
            aria-current={active ? 'step' : undefined}
          >
            {index > 0 ? <span className="connector-setup-stepper-sep" aria-hidden /> : null}
            <span>{t(`connectors.stepper.${id}`)}</span>
          </span>
        );
      })}
    </div>
  );
}
