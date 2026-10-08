import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '../../domain/ports.js';

@Injectable()
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
