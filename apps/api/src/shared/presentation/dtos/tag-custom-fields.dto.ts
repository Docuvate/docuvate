import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import type {
  CustomFieldType,
  ReplaceTagCustomFieldsRequest,
  TagCustomFieldDefinitionDto,
} from '@docuvate/contracts';

export class TagCustomFieldDefinitionDtoClass implements TagCustomFieldDefinitionDto {
  id!: string;
  tagId!: string;
  key!: string;
  label!: string;
  fieldType!: CustomFieldType;
  sortOrder!: number;
}

export class ReplaceTagCustomFieldItemDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsIn(['text', 'date', 'number', 'currency'])
  fieldType?: CustomFieldType;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReplaceTagCustomFieldsRequestDto implements ReplaceTagCustomFieldsRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceTagCustomFieldItemDto)
  fields!: ReplaceTagCustomFieldItemDto[];
}

export class TagCustomFieldListResponseDto {
  items!: TagCustomFieldDefinitionDto[];
}
