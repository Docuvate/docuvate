// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import {
  FIELD_FEEDBACK_ANCHOR_READER,
  type FieldFeedbackAnchorReader,
  type FieldFeedbackPosition,
} from '../../../shared/domain/ports.js';
import { selectConfirmationPosition } from '../domain/select-confirmation-position.js';

/** Looks up where confirmed values sit, from stored region and fact provenance. */
@Injectable()
export class ResolveConfirmationPositionsService {
  constructor(
    @Inject(FIELD_FEEDBACK_ANCHOR_READER) private readonly anchors: FieldFeedbackAnchorReader
  ) {}

  async resolve(
    userId: string,
    documentId: string,
    confirmations: readonly { fieldKey: string; value: string }[]
  ): Promise<(FieldFeedbackPosition | null)[]> {
    if (confirmations.length === 0) {
      return [];
    }
    const { regions, facts } = await this.anchors.listAnchors(userId, documentId);
    return confirmations.map((confirmation) =>
      selectConfirmationPosition({ ...confirmation, regions, facts })
    );
  }
}
