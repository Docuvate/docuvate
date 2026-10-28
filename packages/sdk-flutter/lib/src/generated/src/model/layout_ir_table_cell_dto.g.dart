// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_table_cell_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutIrTableCellDto extends LayoutIrTableCellDto {
  @override
  final String text;
  @override
  final num x;
  @override
  final num y;
  @override
  final num width;
  @override
  final num height;
  @override
  final num? fontSizePt;
  @override
  final String? weight;
  @override
  final num? blockIndex;
  @override
  final String? cellRole;

  factory _$LayoutIrTableCellDto(
          [void Function(LayoutIrTableCellDtoBuilder)? updates]) =>
      (new LayoutIrTableCellDtoBuilder()..update(updates))._build();

  _$LayoutIrTableCellDto._(
      {required this.text,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      this.fontSizePt,
      this.weight,
      this.blockIndex,
      this.cellRole})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        text, r'LayoutIrTableCellDto', 'text');
    BuiltValueNullFieldError.checkNotNull(x, r'LayoutIrTableCellDto', 'x');
    BuiltValueNullFieldError.checkNotNull(y, r'LayoutIrTableCellDto', 'y');
    BuiltValueNullFieldError.checkNotNull(
        width, r'LayoutIrTableCellDto', 'width');
    BuiltValueNullFieldError.checkNotNull(
        height, r'LayoutIrTableCellDto', 'height');
  }

  @override
  LayoutIrTableCellDto rebuild(
          void Function(LayoutIrTableCellDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrTableCellDtoBuilder toBuilder() =>
      new LayoutIrTableCellDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrTableCellDto &&
        text == other.text &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        fontSizePt == other.fontSizePt &&
        weight == other.weight &&
        blockIndex == other.blockIndex &&
        cellRole == other.cellRole;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jc(_$hash, x.hashCode);
    _$hash = $jc(_$hash, y.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, fontSizePt.hashCode);
    _$hash = $jc(_$hash, weight.hashCode);
    _$hash = $jc(_$hash, blockIndex.hashCode);
    _$hash = $jc(_$hash, cellRole.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrTableCellDto')
          ..add('text', text)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('fontSizePt', fontSizePt)
          ..add('weight', weight)
          ..add('blockIndex', blockIndex)
          ..add('cellRole', cellRole))
        .toString();
  }
}

class LayoutIrTableCellDtoBuilder
    implements Builder<LayoutIrTableCellDto, LayoutIrTableCellDtoBuilder> {
  _$LayoutIrTableCellDto? _$v;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

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

  num? _fontSizePt;
  num? get fontSizePt => _$this._fontSizePt;
  set fontSizePt(num? fontSizePt) => _$this._fontSizePt = fontSizePt;

  String? _weight;
  String? get weight => _$this._weight;
  set weight(String? weight) => _$this._weight = weight;

  num? _blockIndex;
  num? get blockIndex => _$this._blockIndex;
  set blockIndex(num? blockIndex) => _$this._blockIndex = blockIndex;

  String? _cellRole;
  String? get cellRole => _$this._cellRole;
  set cellRole(String? cellRole) => _$this._cellRole = cellRole;

  LayoutIrTableCellDtoBuilder() {
    LayoutIrTableCellDto._defaults(this);
  }

  LayoutIrTableCellDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _text = $v.text;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _fontSizePt = $v.fontSizePt;
      _weight = $v.weight;
      _blockIndex = $v.blockIndex;
      _cellRole = $v.cellRole;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrTableCellDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutIrTableCellDto;
  }

  @override
  void update(void Function(LayoutIrTableCellDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrTableCellDto build() => _build();

  _$LayoutIrTableCellDto _build() {
    final _$result = _$v ??
        new _$LayoutIrTableCellDto._(
            text: BuiltValueNullFieldError.checkNotNull(
                text, r'LayoutIrTableCellDto', 'text'),
            x: BuiltValueNullFieldError.checkNotNull(
                x, r'LayoutIrTableCellDto', 'x'),
            y: BuiltValueNullFieldError.checkNotNull(
                y, r'LayoutIrTableCellDto', 'y'),
            width: BuiltValueNullFieldError.checkNotNull(
                width, r'LayoutIrTableCellDto', 'width'),
            height: BuiltValueNullFieldError.checkNotNull(
                height, r'LayoutIrTableCellDto', 'height'),
            fontSizePt: fontSizePt,
            weight: weight,
            blockIndex: blockIndex,
            cellRole: cellRole);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
