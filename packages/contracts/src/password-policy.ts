// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/** Allowed bounds for administratively configured minimum length. */
export const PASSWORD_LENGTH_MIN_BOUND = 8;
export const PASSWORD_LENGTH_MAX_BOUND = 128;

/** Default minimum length when no instance row exists yet. */
export const PASSWORD_DEFAULT_MIN_LENGTH = 12;

export type PasswordPolicyRuleId =
  | 'minLength'
  | 'requireLower'
  | 'requireUpper'
  | 'requireDigit'
  | 'requireSymbol'
  | 'notBreached'
  | 'maxLength';

export interface PasswordPolicyDto {
  minLength: number;
  requireLower: boolean;
  requireUpper: boolean;
  requireDigit: boolean;
  requireSymbol: boolean;
  checkBreached: boolean;
}

export interface PasswordRuleEvaluation {
  rule: PasswordPolicyRuleId;
  met: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicyDto = {
  minLength: PASSWORD_DEFAULT_MIN_LENGTH,
  requireLower: false,
  requireUpper: false,
  requireDigit: false,
  requireSymbol: false,
  checkBreached: false,
};

function hasLowercase(value: string): boolean {
  return /[a-z]/.test(value);
}

function hasUppercase(value: string): boolean {
  return /[A-Z]/.test(value);
}

function hasDigit(value: string): boolean {
  return /\d/.test(value);
}

function hasSymbol(value: string): boolean {
  return /[^a-zA-Z0-9]/.test(value);
}

export function clampPasswordMinLength(value: number): number {
  const rounded = Math.trunc(value);
  return Math.min(
    PASSWORD_LENGTH_MAX_BOUND,
    Math.max(PASSWORD_LENGTH_MIN_BOUND, rounded)
  );
}

export function normalizePasswordPolicy(policy: PasswordPolicyDto): PasswordPolicyDto {
  return {
    minLength: clampPasswordMinLength(policy.minLength),
    requireLower: policy.requireLower,
    requireUpper: policy.requireUpper,
    requireDigit: policy.requireDigit,
    requireSymbol: policy.requireSymbol,
    checkBreached: policy.checkBreached,
  };
}

function evaluateRule(
  rule: PasswordPolicyRuleId,
  policy: PasswordPolicyDto,
  password: string
): boolean {
  switch (rule) {
    case 'minLength':
      return password.length >= policy.minLength;
    case 'requireLower':
      return hasLowercase(password);
    case 'requireUpper':
      return hasUppercase(password);
    case 'requireDigit':
      return hasDigit(password);
    case 'requireSymbol':
      return hasSymbol(password);
    case 'notBreached':
      return true;
    case 'maxLength':
      return password.length <= PASSWORD_LENGTH_MAX_BOUND;
    default: {
      const _exhaustive: never = rule;
      return _exhaustive;
    }
  }
}

/** Rules shown in the live checklist (excludes breach; server-only). */
export function passwordChecklistRuleIds(policy: PasswordPolicyDto, password: string): PasswordPolicyRuleId[] {
  const normalized = normalizePasswordPolicy(policy);
  const rules: PasswordPolicyRuleId[] = ['minLength'];
  if (normalized.requireLower) {
    rules.push('requireLower');
  }
  if (normalized.requireUpper) {
    rules.push('requireUpper');
  }
  if (normalized.requireDigit) {
    rules.push('requireDigit');
  }
  if (normalized.requireSymbol) {
    rules.push('requireSymbol');
  }
  if (normalized.checkBreached) {
    rules.push('notBreached');
  }
  if (password.length > PASSWORD_LENGTH_MAX_BOUND) {
    rules.push('maxLength');
  }
  return rules;
}

/** Preview in administration: all optional rules visible. */
export const PASSWORD_POLICY_PREVIEW_POLICY: PasswordPolicyDto = {
  minLength: PASSWORD_DEFAULT_MIN_LENGTH,
  requireLower: true,
  requireUpper: true,
  requireDigit: true,
  requireSymbol: true,
  checkBreached: true,
};

export function evaluatePassword(
  policy: PasswordPolicyDto,
  password: string
): PasswordRuleEvaluation[] {
  const normalized = normalizePasswordPolicy(policy);
  return passwordChecklistRuleIds(normalized, password).map((rule) => ({
    rule,
    met: evaluateRule(rule, normalized, password),
  }));
}

export function passwordPolicyViolations(
  policy: PasswordPolicyDto,
  password: string,
  options?: { breached?: boolean }
): PasswordPolicyRuleId[] {
  const normalized = normalizePasswordPolicy(policy);
  const breachedKnown = options?.breached;
  const violations: PasswordPolicyRuleId[] = [];
  for (const rule of passwordChecklistRuleIds(normalized, password)) {
    if (rule === 'notBreached') {
      if (breachedKnown === true) {
        violations.push(rule);
      }
      continue;
    }
    if (!evaluateRule(rule, normalized, password)) {
      violations.push(rule);
    }
  }
  return violations;
}
