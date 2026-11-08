// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_table_merge_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentRegionTableMergeDto extends DocumentRegionTableMergeDto {
  @override
  final num row0;
  @override
  final num col0;
  @override
  final num rowSpan;
  @override
  final num colSpan;

  factory _$DocumentRegionTableMergeDto(
          [void Function(DocumentRegionTableMergeDtoBuilder)? updates]) =>
      (DocumentRegionTableMergeDtoBuilder()..update(updates))._build();

  _$DocumentRegionTableMergeDto._(
      {required this.row0,
      required this.col0,
      required this.rowSpan,
      required this.colSpan})
      : super._();
  @override
  DocumentRegionTableMergeDto rebuild(
          void Function(DocumentRegionTableMergeDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionTableMergeDtoBuilder toBuilder() =>
      DocumentRegionTableMergeDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionTableMergeDto &&
        row0 == other.row0 &&
        col0 == other.col0 &&
        rowSpan == other.rowSpan &&
        colSpan == other.colSpan;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, row0.hashCode);
    _$hash = $jc(_$hash, col0.hashCode);
    _$hash = $jc(_$hash, rowSpan.hashCode);
    _$hash = $jc(_$hash, colSpan.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionTableMergeDto')
          ..add('row0', row0)
          ..add('col0', col0)
          ..add('rowSpan', rowSpan)
          ..add('colSpan', colSpan))
        .toString();
  }
}

class DocumentRegionTableMergeDtoBuilder
    implements
        Builder<DocumentRegionTableMergeDto,
            DocumentRegionTableMergeDtoBuilder> {
  _$DocumentRegionTableMergeDto? _$v;

  num? _row0;
  num? get row0 => _$this._row0;
  set row0(num? row0) => _$this._row0 = row0;

  num? _col0;
  num? get col0 => _$this._col0;
  set col0(num? col0) => _$this._col0 = col0;

  num? _rowSpan;
  num? get rowSpan => _$this._rowSpan;
  set rowSpan(num? rowSpan) => _$this._rowSpan = rowSpan;

  num? _colSpan;
  num? get colSpan => _$this._colSpan;
  set colSpan(num? colSpan) => _$this._colSpan = colSpan;

  DocumentRegionTableMergeDtoBuilder() {
    DocumentRegionTableMergeDto._defaults(this);
  }

  DocumentRegionTableMergeDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _row0 = $v.row0;
      _col0 = $v.col0;
      _rowSpan = $v.rowSpan;
      _colSpan = $v.colSpan;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionTableMergeDto other) {
    _$v = other as _$DocumentRegionTableMergeDto;
  }

  @override
  void update(void Function(DocumentRegionTableMergeDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionTableMergeDto build() => _build();

  _$DocumentRegionTableMergeDto _build() {
    final _$result = _$v ??
        _$DocumentRegionTableMergeDto._(
          row0: BuiltValueNullFieldError.checkNotNull(
              row0, r'DocumentRegionTableMergeDto', 'row0'),
          col0: BuiltValueNullFieldError.checkNotNull(
              col0, r'DocumentRegionTableMergeDto', 'col0'),
          rowSpan: BuiltValueNullFieldError.checkNotNull(
              rowSpan, r'DocumentRegionTableMergeDto', 'rowSpan'),
          colSpan: BuiltValueNullFieldError.checkNotNull(
              colSpan, r'DocumentRegionTableMergeDto', 'colSpan'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
