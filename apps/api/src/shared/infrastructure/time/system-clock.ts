import { Injectable } from '@nestjs/common';
import type { Clock } from '../../domain/ports.js';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
