// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable } from '@nestjs/common';

import type { Clock } from '../../domain/ports.js';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
