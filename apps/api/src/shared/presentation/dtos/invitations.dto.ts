import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { AcceptUserInvitationRequest } from '@docuvate/contracts';

export class AcceptUserInvitationRequestDto implements AcceptUserInvitationRequest {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
