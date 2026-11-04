// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_table_cell_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentRegionTableCellDto extends DocumentRegionTableCellDto {
  @override
  final num row;
  @override
  final num col;
  @override
  final String text;

  factory _$DocumentRegionTableCellDto(
          [void Function(DocumentRegionTableCellDtoBuilder)? updates]) =>
      (new DocumentRegionTableCellDtoBuilder()..update(updates))._build();

  _$DocumentRegionTableCellDto._(
      {required this.row, required this.col, required this.text})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        row, r'DocumentRegionTableCellDto', 'row');
    BuiltValueNullFieldError.checkNotNull(
        col, r'DocumentRegionTableCellDto', 'col');
    BuiltValueNullFieldError.checkNotNull(
        text, r'DocumentRegionTableCellDto', 'text');
  }

  @override
  DocumentRegionTableCellDto rebuild(
          void Function(DocumentRegionTableCellDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionTableCellDtoBuilder toBuilder() =>
      new DocumentRegionTableCellDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionTableCellDto &&
        row == other.row &&
        col == other.col &&
        text == other.text;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, row.hashCode);
    _$hash = $jc(_$hash, col.hashCode);
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionTableCellDto')
          ..add('row', row)
          ..add('col', col)
          ..add('text', text))
        .toString();
  }
}

class DocumentRegionTableCellDtoBuilder
    implements
        Builder<DocumentRegionTableCellDto, DocumentRegionTableCellDtoBuilder> {
  _$DocumentRegionTableCellDto? _$v;

  num? _row;
  num? get row => _$this._row;
  set row(num? row) => _$this._row = row;

  num? _col;
  num? get col => _$this._col;
  set col(num? col) => _$this._col = col;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  DocumentRegionTableCellDtoBuilder() {
    DocumentRegionTableCellDto._defaults(this);
  }

  DocumentRegionTableCellDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _row = $v.row;
      _col = $v.col;
      _text = $v.text;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionTableCellDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentRegionTableCellDto;
  }

  @override
  void update(void Function(DocumentRegionTableCellDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionTableCellDto build() => _build();

  _$DocumentRegionTableCellDto _build() {
    final _$result = _$v ??
        new _$DocumentRegionTableCellDto._(
            row: BuiltValueNullFieldError.checkNotNull(
                row, r'DocumentRegionTableCellDto', 'row'),
            col: BuiltValueNullFieldError.checkNotNull(
                col, r'DocumentRegionTableCellDto', 'col'),
            text: BuiltValueNullFieldError.checkNotNull(
                text, r'DocumentRegionTableCellDto', 'text'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
