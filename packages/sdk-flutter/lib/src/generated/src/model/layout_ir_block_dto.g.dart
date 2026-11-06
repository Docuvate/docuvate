// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_block_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutIrBlockDto extends LayoutIrBlockDto {
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
  final String text;
  @override
  final String? fontFamily;
  @override
  final num? fontSizePt;
  @override
  final String? weight;
  @override
  final String? align;
  @override
  final num? columnIndex;
  @override
  final num? blockIndex;
  @override
  final num? rotationDeg;
  @override
  final BuiltList<num>? matrix;
  @override
  final BuiltList<num>? textRgb;
  @override
  final num? textOriginX;
  @override
  final num? textOriginY;

  factory _$LayoutIrBlockDto(
          [void Function(LayoutIrBlockDtoBuilder)? updates]) =>
      (LayoutIrBlockDtoBuilder()..update(updates))._build();

  _$LayoutIrBlockDto._(
      {required this.page,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      required this.text,
      this.fontFamily,
      this.fontSizePt,
      this.weight,
      this.align,
      this.columnIndex,
      this.blockIndex,
      this.rotationDeg,
      this.matrix,
      this.textRgb,
      this.textOriginX,
      this.textOriginY})
      : super._();
  @override
  LayoutIrBlockDto rebuild(void Function(LayoutIrBlockDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrBlockDtoBuilder toBuilder() =>
      LayoutIrBlockDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrBlockDto &&
        page == other.page &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        text == other.text &&
        fontFamily == other.fontFamily &&
        fontSizePt == other.fontSizePt &&
        weight == other.weight &&
        align == other.align &&
        columnIndex == other.columnIndex &&
        blockIndex == other.blockIndex &&
        rotationDeg == other.rotationDeg &&
        matrix == other.matrix &&
        textRgb == other.textRgb &&
        textOriginX == other.textOriginX &&
        textOriginY == other.textOriginY;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, x.hashCode);
    _$hash = $jc(_$hash, y.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jc(_$hash, fontFamily.hashCode);
    _$hash = $jc(_$hash, fontSizePt.hashCode);
    _$hash = $jc(_$hash, weight.hashCode);
    _$hash = $jc(_$hash, align.hashCode);
    _$hash = $jc(_$hash, columnIndex.hashCode);
    _$hash = $jc(_$hash, blockIndex.hashCode);
    _$hash = $jc(_$hash, rotationDeg.hashCode);
    _$hash = $jc(_$hash, matrix.hashCode);
    _$hash = $jc(_$hash, textRgb.hashCode);
    _$hash = $jc(_$hash, textOriginX.hashCode);
    _$hash = $jc(_$hash, textOriginY.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrBlockDto')
          ..add('page', page)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('text', text)
          ..add('fontFamily', fontFamily)
          ..add('fontSizePt', fontSizePt)
          ..add('weight', weight)
          ..add('align', align)
          ..add('columnIndex', columnIndex)
          ..add('blockIndex', blockIndex)
          ..add('rotationDeg', rotationDeg)
          ..add('matrix', matrix)
          ..add('textRgb', textRgb)
          ..add('textOriginX', textOriginX)
          ..add('textOriginY', textOriginY))
        .toString();
  }
}

class LayoutIrBlockDtoBuilder
    implements Builder<LayoutIrBlockDto, LayoutIrBlockDtoBuilder> {
  _$LayoutIrBlockDto? _$v;

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

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  String? _fontFamily;
  String? get fontFamily => _$this._fontFamily;
  set fontFamily(String? fontFamily) => _$this._fontFamily = fontFamily;

  num? _fontSizePt;
  num? get fontSizePt => _$this._fontSizePt;
  set fontSizePt(num? fontSizePt) => _$this._fontSizePt = fontSizePt;

  String? _weight;
  String? get weight => _$this._weight;
  set weight(String? weight) => _$this._weight = weight;

  String? _align;
  String? get align => _$this._align;
  set align(String? align) => _$this._align = align;

  num? _columnIndex;
  num? get columnIndex => _$this._columnIndex;
  set columnIndex(num? columnIndex) => _$this._columnIndex = columnIndex;

  num? _blockIndex;
  num? get blockIndex => _$this._blockIndex;
  set blockIndex(num? blockIndex) => _$this._blockIndex = blockIndex;

  num? _rotationDeg;
  num? get rotationDeg => _$this._rotationDeg;
  set rotationDeg(num? rotationDeg) => _$this._rotationDeg = rotationDeg;

  ListBuilder<num>? _matrix;
  ListBuilder<num> get matrix => _$this._matrix ??= ListBuilder<num>();
  set matrix(ListBuilder<num>? matrix) => _$this._matrix = matrix;

  ListBuilder<num>? _textRgb;
  ListBuilder<num> get textRgb => _$this._textRgb ??= ListBuilder<num>();
  set textRgb(ListBuilder<num>? textRgb) => _$this._textRgb = textRgb;

  num? _textOriginX;
  num? get textOriginX => _$this._textOriginX;
  set textOriginX(num? textOriginX) => _$this._textOriginX = textOriginX;

  num? _textOriginY;
  num? get textOriginY => _$this._textOriginY;
  set textOriginY(num? textOriginY) => _$this._textOriginY = textOriginY;

  LayoutIrBlockDtoBuilder() {
    LayoutIrBlockDto._defaults(this);
  }

  LayoutIrBlockDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _page = $v.page;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _text = $v.text;
      _fontFamily = $v.fontFamily;
      _fontSizePt = $v.fontSizePt;
      _weight = $v.weight;
      _align = $v.align;
      _columnIndex = $v.columnIndex;
      _blockIndex = $v.blockIndex;
      _rotationDeg = $v.rotationDeg;
      _matrix = $v.matrix?.toBuilder();
      _textRgb = $v.textRgb?.toBuilder();
      _textOriginX = $v.textOriginX;
      _textOriginY = $v.textOriginY;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrBlockDto other) {
    _$v = other as _$LayoutIrBlockDto;
  }

  @override
  void update(void Function(LayoutIrBlockDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrBlockDto build() => _build();

  _$LayoutIrBlockDto _build() {
    _$LayoutIrBlockDto _$result;
    try {
      _$result = _$v ??
          _$LayoutIrBlockDto._(
            page: BuiltValueNullFieldError.checkNotNull(
                page, r'LayoutIrBlockDto', 'page'),
            x: BuiltValueNullFieldError.checkNotNull(
                x, r'LayoutIrBlockDto', 'x'),
            y: BuiltValueNullFieldError.checkNotNull(
                y, r'LayoutIrBlockDto', 'y'),
            width: BuiltValueNullFieldError.checkNotNull(
                width, r'LayoutIrBlockDto', 'width'),
            height: BuiltValueNullFieldError.checkNotNull(
                height, r'LayoutIrBlockDto', 'height'),
            text: BuiltValueNullFieldError.checkNotNull(
                text, r'LayoutIrBlockDto', 'text'),
            fontFamily: fontFamily,
            fontSizePt: fontSizePt,
            weight: weight,
            align: align,
            columnIndex: columnIndex,
            blockIndex: blockIndex,
            rotationDeg: rotationDeg,
            matrix: _matrix?.build(),
            textRgb: _textRgb?.build(),
            textOriginX: textOriginX,
            textOriginY: textOriginY,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'matrix';
        _matrix?.build();
        _$failedField = 'textRgb';
        _textRgb?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LayoutIrBlockDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
