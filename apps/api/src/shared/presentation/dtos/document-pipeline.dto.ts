// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiProperty } from '@nestjs/swagger';

export class DocumentPipelineModuleDescriptorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  defaultEnabled!: boolean;

  @ApiProperty()
  defaultOrder!: number;
}

export class DocumentPipelineModulesResponseDto {
  @ApiProperty({ type: [DocumentPipelineModuleDescriptorDto] })
  modules!: DocumentPipelineModuleDescriptorDto[];
}
