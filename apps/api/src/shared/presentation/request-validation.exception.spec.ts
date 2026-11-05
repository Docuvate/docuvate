// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES } from '@docuvate/contracts';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { problemForException } from './problem-exception.filter.js';
import {
  RequestValidationException,
  requestValidationExceptionFactory,
} from './request-validation.exception.js';

class ItemDto {
  @IsUUID()
  tagId!: string;
}

class BodyDto {
  @IsString()
  fieldKey!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
}

const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory: requestValidationExceptionFactory,
});

async function rejectionOf(body: unknown): Promise<unknown> {
  try {
    await pipe.transform(body, { type: 'body', metatype: BodyDto });
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('request validation problems', () => {
  it('names missing, unknown and nested invalid properties without their values', async () => {
    const error = await rejectionOf({ key: 'secret-value', items: [{ tagId: 'not-a-uuid' }] });

    expect(error).toBeInstanceOf(RequestValidationException);
    const problem = problemForException(error, 'req-1');
    expect(problem).toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_FAILED,
      detail: 'errors.codes.VALIDATION_FAILED',
      requestId: 'req-1',
    });
    expect([...(problem.invalidParams ?? [])].sort()).toEqual(['fieldKey', 'items.0.tagId', 'key']);
    expect(JSON.stringify(problem)).not.toContain('secret-value');
  });

  it('passes a valid body through', async () => {
    const value: unknown = await pipe.transform(
      { fieldKey: 'global:rechnungsnummer', items: [] },
      { type: 'body', metatype: BodyDto }
    );
    expect(value).toBeInstanceOf(BodyDto);
  });

  it('leaves other errors without invalidParams', () => {
    const problem = problemForException(new Error('boom'), 'req-2');
    expect(problem.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(problem.invalidParams).toBeUndefined();
  });
});
