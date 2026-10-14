// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterEach, describe, expect, it } from 'vitest';

import { readFeatureFlagDefaultsFromEnv } from './read-feature-flag-defaults.js';

const ENV_KEYS = [
  'DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE',
  'DOCUVATE_FEATURE_SOURCE_CONNECTORS',
  'DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS',
  'DOCUVATE_FEATURE_EXACT_ANSWERS',
  'DOCUVATE_FEATURE_SMART_DUPLICATES',
  'DOCUVATE_FEATURE_ANSWER_ABSTENTION',
  'DOCUVATE_FEATURE_LEARNED_VALUE_TYPES',
  'DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES',
  'DOCUVATE_FEATURE_LOCAL_CHAT_MODEL',
] as const;

describe('readFeatureFlagDefaultsFromEnv', () => {
  const original: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });

  it('defaults conservative flags off and learned value types on when env is unset', () => {
    for (const key of ENV_KEYS) {
      original[key] ??= process.env[key];
      delete process.env[key];
    }
    expect(readFeatureFlagDefaultsFromEnv()).toEqual({
      layoutReconstructionCompare: false,
      sourceConnectors: false,
      experimentalResearchModels: false,
      exactAnswers: false,
      smartDuplicates: false,
      answerAbstention: false,
      learnedValueTypes: true,
      layoutKeyValueRoles: false,
      localChatModel: false,
    });
  });

  it('parses true-like env values', () => {
    for (const key of ENV_KEYS) {
      original[key] ??= process.env[key];
    }
    process.env['DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE'] = 'true';
    process.env['DOCUVATE_FEATURE_SOURCE_CONNECTORS'] = '1';
    process.env['DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS'] = 'yes';
    process.env['DOCUVATE_FEATURE_EXACT_ANSWERS'] = 'true';
    process.env['DOCUVATE_FEATURE_SMART_DUPLICATES'] = '1';
    process.env['DOCUVATE_FEATURE_ANSWER_ABSTENTION'] = 'yes';
    process.env['DOCUVATE_FEATURE_LEARNED_VALUE_TYPES'] = 'true';
    process.env['DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES'] = '1';
    process.env['DOCUVATE_FEATURE_LOCAL_CHAT_MODEL'] = 'yes';
    expect(readFeatureFlagDefaultsFromEnv()).toEqual({
      layoutReconstructionCompare: true,
      sourceConnectors: true,
      experimentalResearchModels: true,
      exactAnswers: true,
      smartDuplicates: true,
      answerAbstention: true,
      learnedValueTypes: true,
      layoutKeyValueRoles: true,
      localChatModel: true,
    });
  });

  it('allows disabling learned value types via env', () => {
    for (const key of ENV_KEYS) {
      original[key] ??= process.env[key];
      delete process.env[key];
    }
    process.env['DOCUVATE_FEATURE_LEARNED_VALUE_TYPES'] = 'false';
    expect(readFeatureFlagDefaultsFromEnv().learnedValueTypes).toBe(false);
  });
});
