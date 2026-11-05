// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { plainToInstance } from 'class-transformer';
import { validate, type ValidatorOptions } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { ConfirmDocumentFieldRequestDto } from './document-regions.dto.js';

const VALIDATION: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

async function invalidProperties(body: object): Promise<string[]> {
  const dto = plainToInstance(ConfirmDocumentFieldRequestDto, body);
  const errors = await validate(dto, VALIDATION);
  return errors.map((error) => error.property).sort();
}

describe('ConfirmDocumentFieldRequestDto', () => {
  it('accepts the body the web client sends', async () => {
    expect(await invalidProperties({ fieldKey: 'global:rechnungsnummer', value: 'RE-1' })).toEqual(
      []
    );
  });

  it('accepts an empty value (keeps the stored value)', async () => {
    expect(await invalidProperties({ fieldKey: 'global:iban', value: '' })).toEqual([]);
  });

  it('names the wrong property when `key` is sent instead of `fieldKey`', async () => {
    expect(await invalidProperties({ key: 'global:iban', value: 'DE89' })).toEqual([
      'fieldKey',
      'key',
    ]);
  });

  it('rejects an empty fieldKey', async () => {
    expect(await invalidProperties({ fieldKey: '', value: 'DE89' })).toEqual(['fieldKey']);
  });
});
