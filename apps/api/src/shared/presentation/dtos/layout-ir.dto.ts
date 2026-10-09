// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

/** OpenAPI DTOs for layout IR (field names aligned with `@docuvate/contracts` JSON). */
export class LayoutIrBlockDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  text!: string;

  @ApiProperty({ required: false })
  fontFamily?: string;

  @ApiProperty({ required: false })
  fontSizePt?: number;

  @ApiProperty({ required: false })
  weight?: string;

  @ApiProperty({ required: false })
  align?: string;

  @ApiProperty({ required: false })
  columnIndex?: number;

  @ApiProperty({ required: false })
  blockIndex?: number;

  @ApiProperty({ required: false })
  rotationDeg?: number;

  @ApiProperty({ required: false, type: [Number], minItems: 6, maxItems: 6 })
  matrix?: number[];

  @ApiProperty({ required: false, type: [Number], minItems: 3, maxItems: 3 })
  textRgb?: number[];

  @ApiProperty({ required: false })
  textOriginX?: number;

  @ApiProperty({ required: false })
  textOriginY?: number;
}

export class LayoutIrLineDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  text!: string;

  @ApiProperty({ required: false })
  fontFamily?: string;

  @ApiProperty({ required: false })
  fontSizePt?: number;

  @ApiProperty({ required: false })
  weight?: string;

  @ApiProperty({ required: false })
  align?: string;

  @ApiProperty({ required: false })
  blockIndex?: number;
}

export class LayoutIrVectorDto {
  @ApiProperty({ enum: ['rect', 'line', 'path'] })
  kind!: string;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty({ required: false })
  strokeWidthPt?: number;

  @ApiProperty({ required: false })
  filled?: boolean;

  @ApiProperty({ required: false })
  fillGray?: number;

  @ApiProperty({ required: false, type: [Number], minItems: 3, maxItems: 3 })
  fillRgb?: number[];

  @ApiProperty({ required: false, type: [Number], minItems: 3, maxItems: 3 })
  strokeRgb?: number[];

  @ApiProperty({ required: false })
  pathD?: string;
}

export class LayoutIrWidgetDto {
  @ApiProperty({ enum: ['text', 'checkbox'] })
  kind!: string;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty({ required: false })
  value?: string;

  @ApiProperty({ required: false })
  checked?: boolean;

  @ApiProperty({ required: false })
  fieldName?: string;

  @ApiProperty({ required: false })
  rotationDeg?: number;

  @ApiProperty({ required: false })
  fontSizePt?: number;

  @ApiProperty({ required: false })
  fontFamily?: string;

  @ApiProperty({ required: false })
  align?: string;

  @ApiProperty({ required: false })
  checkMark?: string;
}

export class LayoutIrTableCellDto {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty({ required: false })
  fontSizePt?: number;

  @ApiProperty({ required: false })
  weight?: string;

  @ApiProperty({ required: false })
  blockIndex?: number;

  @ApiProperty({ required: false })
  cellRole?: string;
}

@ApiExtraModels(LayoutIrTableCellDto)
export class LayoutIrTableDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  x!: number;

  @ApiProperty()
  y!: number;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  columnCount!: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'array',
      items: { $ref: getSchemaPath(LayoutIrTableCellDto) },
    },
  })
  rows!: LayoutIrTableCellDto[][];
}

@ApiExtraModels(
  LayoutIrBlockDto,
  LayoutIrLineDto,
  LayoutIrVectorDto,
  LayoutIrWidgetDto,
  LayoutIrTableDto
)
export class LayoutIrPageDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  widthPt!: number;

  @ApiProperty()
  heightPt!: number;

  @ApiProperty({ type: [LayoutIrBlockDto] })
  blocks!: LayoutIrBlockDto[];

  @ApiProperty({ type: [LayoutIrLineDto], required: false })
  lines?: LayoutIrLineDto[];

  @ApiProperty({ type: [LayoutIrTableDto], required: false })
  tables?: LayoutIrTableDto[];

  @ApiProperty({ type: [LayoutIrVectorDto], required: false })
  vectors?: LayoutIrVectorDto[];

  @ApiProperty({ type: [LayoutIrWidgetDto], required: false })
  widgets?: LayoutIrWidgetDto[];
}

export class LayoutIrDocumentDto {
  @ApiProperty({ enum: [1] })
  version!: 1;

  @ApiProperty({ type: [LayoutIrPageDto] })
  pages!: LayoutIrPageDto[];
}

export class LayoutHtmlResponseDto {
  @ApiProperty()
  html!: string;

  @ApiProperty({ default: true })
  reconstructionReliable!: boolean;

  @ApiProperty({ required: false, nullable: true })
  unreliableReason?: string | null;
}

export class LayoutTypstResponseDto {
  @ApiProperty()
  typst!: string;

  @ApiProperty({ enum: ['exakt', 'semantisch'], default: 'exakt' })
  exportMode!: 'exakt' | 'semantisch';

  @ApiProperty({ default: true })
  reconstructionReliable!: boolean;

  @ApiProperty({ required: false, nullable: true })
  unreliableReason?: string | null;
}
