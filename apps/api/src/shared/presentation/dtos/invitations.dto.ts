// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AcceptUserInvitationRequest } from '@docuvate/contracts';
import { IsString, MinLength } from 'class-validator';

export class AcceptUserInvitationRequestDto implements AcceptUserInvitationRequest {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
