// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_line_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutIrLineDto extends LayoutIrLineDto {
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
  final num? blockIndex;

  factory _$LayoutIrLineDto([void Function(LayoutIrLineDtoBuilder)? updates]) =>
      (LayoutIrLineDtoBuilder()..update(updates))._build();

  _$LayoutIrLineDto._(
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
      this.blockIndex})
      : super._();
  @override
  LayoutIrLineDto rebuild(void Function(LayoutIrLineDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrLineDtoBuilder toBuilder() => LayoutIrLineDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrLineDto &&
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
        blockIndex == other.blockIndex;
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
    _$hash = $jc(_$hash, blockIndex.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrLineDto')
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
          ..add('blockIndex', blockIndex))
        .toString();
  }
}

class LayoutIrLineDtoBuilder
    implements Builder<LayoutIrLineDto, LayoutIrLineDtoBuilder> {
  _$LayoutIrLineDto? _$v;

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

  num? _blockIndex;
  num? get blockIndex => _$this._blockIndex;
  set blockIndex(num? blockIndex) => _$this._blockIndex = blockIndex;

  LayoutIrLineDtoBuilder() {
    LayoutIrLineDto._defaults(this);
  }

  LayoutIrLineDtoBuilder get _$this {
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
      _blockIndex = $v.blockIndex;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrLineDto other) {
    _$v = other as _$LayoutIrLineDto;
  }

  @override
  void update(void Function(LayoutIrLineDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrLineDto build() => _build();

  _$LayoutIrLineDto _build() {
    final _$result = _$v ??
        _$LayoutIrLineDto._(
          page: BuiltValueNullFieldError.checkNotNull(
              page, r'LayoutIrLineDto', 'page'),
          x: BuiltValueNullFieldError.checkNotNull(x, r'LayoutIrLineDto', 'x'),
          y: BuiltValueNullFieldError.checkNotNull(y, r'LayoutIrLineDto', 'y'),
          width: BuiltValueNullFieldError.checkNotNull(
              width, r'LayoutIrLineDto', 'width'),
          height: BuiltValueNullFieldError.checkNotNull(
              height, r'LayoutIrLineDto', 'height'),
          text: BuiltValueNullFieldError.checkNotNull(
              text, r'LayoutIrLineDto', 'text'),
          fontFamily: fontFamily,
          fontSizePt: fontSizePt,
          weight: weight,
          align: align,
          blockIndex: blockIndex,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
