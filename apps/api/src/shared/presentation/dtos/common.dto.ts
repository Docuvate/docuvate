import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { MatchingAlgorithm } from '@docuvate/contracts';

const MATCHING_ALGORITHMS: MatchingAlgorithm[] = ['none', 'any', 'all', 'exact', 'regex'];

export class ApiErrorEnvelopeDto {
  @ApiProperty({ example: 'FORBIDDEN' })
  code!: string;

  @ApiProperty({ example: 'ABAC denied' })
  message!: string;
}

export class OkResponseDto {
  @IsBoolean()
  ok!: true;
}

export class ExtractedFieldDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class ExtractionBlockDto {
  @IsInt()
  @Min(1)
  page!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  x!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  width!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  height!: number;

  @IsString()
  text!: string;

  @IsOptional()
  @IsInt()
  blockIndex?: number;
}

export class MatchingAlgorithmFieldsDto {
  @IsOptional()
  @IsIn(MATCHING_ALGORITHMS)
  matchingAlgorithm?: MatchingAlgorithm;

  @IsOptional()
  @IsString()
  match?: string;
}

export class DocumentBulkActionDto {
  @IsIn(['addTag', 'removeTag', 'setCorrespondent', 'setFolder', 'delete'])
  action!:
    | 'addTag'
    | 'removeTag'
    | 'setCorrespondent'
    | 'setFolder'
    | 'delete';

  @ValidateIf((o: DocumentBulkActionDto) => o.action === 'addTag' || o.action === 'removeTag')
  @IsUUID('4')
  tagId?: string;

  @ValidateIf((o: DocumentBulkActionDto) => o.action === 'setCorrespondent')
  @IsOptional()
  @IsUUID('4')
  correspondentId?: string | null;

  @ValidateIf((o: DocumentBulkActionDto) => o.action === 'setFolder')
  @IsOptional()
  @IsUUID('4')
  folderId?: string | null;
}

export class DocumentBulkRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids!: string[];

  @ValidateNested()
  @Type(() => DocumentBulkActionDto)
  bulk!: DocumentBulkActionDto;
}

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class DocumentChatRequestDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export class DocumentChatResponseDto {
  reply!: ChatMessageDto;
  configured!: boolean;
  provider?: string;
  setupHint?: string | null;
}

export class CreateDocumentChatThreadRequestDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class DocumentChatThreadMessagesResponseDto {
  messages!: ChatMessageRecordDto[];
}

export class DocumentChatThreadListResponseDto {
  threads!: DocumentChatThreadDto[];
}

export class ChatMessageRecordDto {
  id!: string;
  role!: 'user' | 'assistant';
  content!: string;
  createdAt!: string;
  updatedAt?: string;
  generationStatus?: 'pending' | 'streaming' | 'done' | 'failed' | null;
  generationPhase?: 'retrieving' | 'generating' | 'verifying' | null;
  errorCode?: string | null;
}

export class DocumentChatThreadDto {
  id!: string;
  title!: string;
  scope!: 'document' | 'library';
  documentIds!: string[];
  createdAt!: string;
  updatedAt!: string;
  lastMessagePreview?: string | null;
  activeGenerationStatus?: 'pending' | 'streaming' | 'done' | 'failed' | null;
}

export class SendDocumentChatThreadMessageRequestDto {
  @IsString()
  message!: string;
}

export class SendDocumentChatThreadMessageResponseDto extends DocumentChatResponseDto {
  userMessage!: ChatMessageRecordDto;
  assistantMessage!: ChatMessageRecordDto;
  asyncGeneration?: boolean;
}

export class ExtractionCompareRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engines?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxPages?: number;
}

export class ExtractionArenaRatingRequestDto {
  @IsString()
  winnerEngine!: string;

  @IsArray()
  @IsString({ each: true })
  comparedEngines!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  applyAsDefault?: boolean;
}

export class DuplicateStackSetPrimaryRequestDto {
  @IsUUID('4')
  documentId!: string;

  @IsUUID('4')
  stackId!: string;
}

export class DuplicateStackKeepVersionRequestDto {
  @IsUUID('4')
  versionDocumentId!: string;
}

export class DuplicateStackNotDuplicateRequestDto {
  @IsUUID('4')
  otherDocumentId!: string;
}
