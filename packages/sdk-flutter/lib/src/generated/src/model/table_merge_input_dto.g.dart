// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'table_merge_input_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TableMergeInputDto extends TableMergeInputDto {
  @override
  final num row0;
  @override
  final num col0;
  @override
  final num rowSpan;
  @override
  final num colSpan;

  factory _$TableMergeInputDto(
          [void Function(TableMergeInputDtoBuilder)? updates]) =>
      (TableMergeInputDtoBuilder()..update(updates))._build();

  _$TableMergeInputDto._(
      {required this.row0,
      required this.col0,
      required this.rowSpan,
      required this.colSpan})
      : super._();
  @override
  TableMergeInputDto rebuild(
          void Function(TableMergeInputDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TableMergeInputDtoBuilder toBuilder() =>
      TableMergeInputDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TableMergeInputDto &&
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
    return (newBuiltValueToStringHelper(r'TableMergeInputDto')
          ..add('row0', row0)
          ..add('col0', col0)
          ..add('rowSpan', rowSpan)
          ..add('colSpan', colSpan))
        .toString();
  }
}

class TableMergeInputDtoBuilder
    implements Builder<TableMergeInputDto, TableMergeInputDtoBuilder> {
  _$TableMergeInputDto? _$v;

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

  TableMergeInputDtoBuilder() {
    TableMergeInputDto._defaults(this);
  }

  TableMergeInputDtoBuilder get _$this {
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
  void replace(TableMergeInputDto other) {
    _$v = other as _$TableMergeInputDto;
  }

  @override
  void update(void Function(TableMergeInputDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TableMergeInputDto build() => _build();

  _$TableMergeInputDto _build() {
    final _$result = _$v ??
        _$TableMergeInputDto._(
          row0: BuiltValueNullFieldError.checkNotNull(
              row0, r'TableMergeInputDto', 'row0'),
          col0: BuiltValueNullFieldError.checkNotNull(
              col0, r'TableMergeInputDto', 'col0'),
          rowSpan: BuiltValueNullFieldError.checkNotNull(
              rowSpan, r'TableMergeInputDto', 'rowSpan'),
          colSpan: BuiltValueNullFieldError.checkNotNull(
              colSpan, r'TableMergeInputDto', 'colSpan'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
