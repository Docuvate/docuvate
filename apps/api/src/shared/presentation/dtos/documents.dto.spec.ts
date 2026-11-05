// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { plainToInstance } from 'class-transformer';
import { validate, type ValidatorOptions } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpdateDocumentRequestDto } from './documents.dto.js';

const VALIDATION: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

describe('UpdateDocumentRequestDto extraction fields', () => {
  it('accepts fields exactly as GET /v1/documents/:id returns them', async () => {
    const dto = plainToInstance(UpdateDocumentRequestDto, {
      extractionFields: [
        { key: 'global:rechnungsnummer', value: 'RE-1', confidence: 0.9, userConfirmed: true },
        {
          key: 'label:5f0c7a52-3f4e-4d1b-9a55-0e7c2f9b1c11:kundennummer',
          value: 'K-7',
          tagId: '5f0c7a52-3f4e-4d1b-9a55-0e7c2f9b1c11',
          userConfirmed: false,
        },
      ],
    });
    expect(await validate(dto, VALIDATION)).toHaveLength(0);
  });

  it('rejects properties the field contract does not know', async () => {
    const dto = plainToInstance(UpdateDocumentRequestDto, {
      extractionFields: [{ key: 'global:iban', value: 'DE89', source: 'ocr' }],
    });
    const errors = await validate(dto, VALIDATION);
    expect(errors.map((error) => error.property)).toEqual(['extractionFields']);
  });

  it('rejects a tagId that is not a UUID', async () => {
    const dto = plainToInstance(UpdateDocumentRequestDto, {
      extractionFields: [{ key: 'global:iban', value: 'DE89', tagId: 'not-a-uuid' }],
    });
    expect(await validate(dto, VALIDATION)).toHaveLength(1);
  });
});
