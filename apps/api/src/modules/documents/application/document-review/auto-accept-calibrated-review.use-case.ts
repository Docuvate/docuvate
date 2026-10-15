// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Injectable, Logger } from '@nestjs/common';

import { buildUserAuthorizationSubject } from '../../../../shared/infrastructure/auth/user-authorization-subject.js';
import { INSTANCE_ROLE_MEMBER } from '../../../auth/domain/instance-role.constants.js';
import { autoPromoteMinConfidenceForField } from '../../domain/value-type-field-confidence.js';
import { AcceptDocumentReviewUseCase } from './accept-document-review.use-case.js';

@Injectable()
export class AutoAcceptCalibratedReviewUseCase {
  private readonly logger = new Logger(AutoAcceptCalibratedReviewUseCase.name);

  constructor(private readonly acceptReview: AcceptDocumentReviewUseCase) {}

  resolveAutoAcceptMinConfidence(): number {
    return Math.min(
      autoPromoteMinConfidenceForField('vendor'),
      autoPromoteMinConfidenceForField('date'),
      autoPromoteMinConfidenceForField('amount'),
      0.82
    );
  }

  async execute(documentId: string, userId: string): Promise<void> {
    const subject = buildUserAuthorizationSubject({
      id: userId,
      installationRole: INSTANCE_ROLE_MEMBER,
    });
    const minConfidence = this.resolveAutoAcceptMinConfidence();
    try {
      await this.acceptReview.execute(documentId, userId, subject, { minConfidence });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Auto-accept review skipped for ${documentId}: ${message}`);
    }
  }
}
