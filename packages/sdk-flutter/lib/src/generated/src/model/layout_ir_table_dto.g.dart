// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_table_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutIrTableDto extends LayoutIrTableDto {
  @override
  final num page;
  @override
  final num x;
  @override
  final num y;
  @override
  final num width;
  @override
  final num height;
  @override
  final num columnCount;
  @override
  final BuiltList<BuiltList<LayoutIrTableCellDto>> rows;

  factory _$LayoutIrTableDto(
          [void Function(LayoutIrTableDtoBuilder)? updates]) =>
      (LayoutIrTableDtoBuilder()..update(updates))._build();

  _$LayoutIrTableDto._(
      {required this.page,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      required this.columnCount,
      required this.rows})
      : super._();
  @override
  LayoutIrTableDto rebuild(void Function(LayoutIrTableDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrTableDtoBuilder toBuilder() =>
      LayoutIrTableDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrTableDto &&
        page == other.page &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        columnCount == other.columnCount &&
        rows == other.rows;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, x.hashCode);
    _$hash = $jc(_$hash, y.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, columnCount.hashCode);
    _$hash = $jc(_$hash, rows.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrTableDto')
          ..add('page', page)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('columnCount', columnCount)
          ..add('rows', rows))
        .toString();
  }
}

class LayoutIrTableDtoBuilder
    implements Builder<LayoutIrTableDto, LayoutIrTableDtoBuilder> {
  _$LayoutIrTableDto? _$v;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  num? _x;
  num? get x => _$this._x;
  set x(num? x) => _$this._x = x;

  num? _y;
  num? get y => _$this._y;
  set y(num? y) => _$this._y = y;

  num? _width;
  num? get width => _$this._width;
  set width(num? width) => _$this._width = width;

  num? _height;
  num? get height => _$this._height;
  set height(num? height) => _$this._height = height;

  num? _columnCount;
  num? get columnCount => _$this._columnCount;
  set columnCount(num? columnCount) => _$this._columnCount = columnCount;

  ListBuilder<BuiltList<LayoutIrTableCellDto>>? _rows;
  ListBuilder<BuiltList<LayoutIrTableCellDto>> get rows =>
      _$this._rows ??= ListBuilder<BuiltList<LayoutIrTableCellDto>>();
  set rows(ListBuilder<BuiltList<LayoutIrTableCellDto>>? rows) =>
      _$this._rows = rows;

  LayoutIrTableDtoBuilder() {
    LayoutIrTableDto._defaults(this);
  }

  LayoutIrTableDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _page = $v.page;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _columnCount = $v.columnCount;
      _rows = $v.rows.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrTableDto other) {
    _$v = other as _$LayoutIrTableDto;
  }

  @override
  void update(void Function(LayoutIrTableDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrTableDto build() => _build();

  _$LayoutIrTableDto _build() {
    _$LayoutIrTableDto _$result;
    try {
      _$result = _$v ??
          _$LayoutIrTableDto._(
            page: BuiltValueNullFieldError.checkNotNull(
                page, r'LayoutIrTableDto', 'page'),
            x: BuiltValueNullFieldError.checkNotNull(
                x, r'LayoutIrTableDto', 'x'),
            y: BuiltValueNullFieldError.checkNotNull(
                y, r'LayoutIrTableDto', 'y'),
            width: BuiltValueNullFieldError.checkNotNull(
                width, r'LayoutIrTableDto', 'width'),
            height: BuiltValueNullFieldError.checkNotNull(
                height, r'LayoutIrTableDto', 'height'),
            columnCount: BuiltValueNullFieldError.checkNotNull(
                columnCount, r'LayoutIrTableDto', 'columnCount'),
            rows: rows.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'rows';
        rows.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LayoutIrTableDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
