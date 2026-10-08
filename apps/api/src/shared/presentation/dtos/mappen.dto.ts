import { IsOptional, IsString } from 'class-validator';
import type { CreateMappeRequest, MappeDto, UpdateMappeRequest } from '@docuvate/contracts';

export class CreateMappeRequestDto implements CreateMappeRequest {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string | null;
}

export class UpdateMappeRequestDto implements UpdateMappeRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string | null;
}

export class MappeListResponseDto {
  items!: MappeDto[];
}

export class MappeResponseDto implements MappeDto {
  id!: string;
  name!: string;
  createdAt!: string;
  updatedAt!: string;
}
