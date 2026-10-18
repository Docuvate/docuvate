// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiProperty } from '@nestjs/swagger';

export class EncoderReindexProgressDto {
  @ApiProperty()
  targetEncoderId!: string;

  @ApiProperty()
  targetEncoderRevision!: string;

  @ApiProperty({ description: 'Documents already at the target encoder revision.' })
  progressProcessed!: number;

  @ApiProperty({ description: 'Extracted ready documents in this tenant.' })
  progressTotal!: number;

  @ApiProperty({ description: 'Documents still queued for background re-embedding.' })
  progressPending!: number;
}
