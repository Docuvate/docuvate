// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto, PasswordPolicyRuleId } from '@docuvate/contracts';
import { evaluatePassword, PASSWORD_LENGTH_MAX_BOUND } from '@docuvate/contracts';
import { Circle, CircleCheck, CircleX } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const ICON_SIZE = 14;

interface PasswordPolicyChecklistProps {
  policy: PasswordPolicyDto;
  password: string;
  id?: string;
}

function ruleLabelKey(rule: PasswordPolicyRuleId): string {
  switch (rule) {
    case 'minLength':
      return 'auth.passwordPolicy.rules.minLength';
    case 'requireLower':
      return 'auth.passwordPolicy.rules.requireLower';
    case 'requireUpper':
      return 'auth.passwordPolicy.rules.requireUpper';
    case 'requireDigit':
      return 'auth.passwordPolicy.rules.requireDigit';
    case 'requireSymbol':
      return 'auth.passwordPolicy.rules.requireSymbol';
    case 'notBreached':
      return 'auth.passwordPolicy.rules.notBreached';
    case 'maxLength':
      return 'auth.passwordPolicy.rules.maxLength';
    default: {
      const _exhaustive: never = rule;
      return _exhaustive;
    }
  }
}

export function PasswordPolicyChecklist({ policy, password, id }: PasswordPolicyChecklistProps) {
  const { t } = useTranslation();
  const rows = useMemo(() => evaluatePassword(policy, password), [policy, password]);

  return (
    <ul className="password-policy-checklist" id={id} aria-live="polite">
      {rows.map((row) => {
        const violated = password.length > 0 && !row.met;
        const fulfilled = password.length > 0 && row.met;
        const Icon = violated ? CircleX : fulfilled ? CircleCheck : Circle;
        const stateClass = violated
          ? 'password-policy-checklist-row--danger'
          : fulfilled
            ? 'password-policy-checklist-row--ok'
            : 'password-policy-checklist-row--open';
        return (
          <li key={row.rule} className={`password-policy-checklist-row ${stateClass}`}>
            <Icon size={ICON_SIZE} strokeWidth={1.75} aria-hidden />
            <span>
              {t(ruleLabelKey(row.rule), {
                min: policy.minLength,
                max: PASSWORD_LENGTH_MAX_BOUND,
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
