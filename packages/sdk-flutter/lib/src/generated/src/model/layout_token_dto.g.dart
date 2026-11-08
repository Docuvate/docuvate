// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_token_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutTokenDto extends LayoutTokenDto {
  @override
  final num blockIndex;
  @override
  final num page;
  @override
  final num x0;
  @override
  final num y0;
  @override
  final num x1;
  @override
  final num y1;
  @override
  final String text;

  factory _$LayoutTokenDto([void Function(LayoutTokenDtoBuilder)? updates]) =>
      (LayoutTokenDtoBuilder()..update(updates))._build();

  _$LayoutTokenDto._(
      {required this.blockIndex,
      required this.page,
      required this.x0,
      required this.y0,
      required this.x1,
      required this.y1,
      required this.text})
      : super._();
  @override
  LayoutTokenDto rebuild(void Function(LayoutTokenDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutTokenDtoBuilder toBuilder() => LayoutTokenDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutTokenDto &&
        blockIndex == other.blockIndex &&
        page == other.page &&
        x0 == other.x0 &&
        y0 == other.y0 &&
        x1 == other.x1 &&
        y1 == other.y1 &&
        text == other.text;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, blockIndex.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, x0.hashCode);
    _$hash = $jc(_$hash, y0.hashCode);
    _$hash = $jc(_$hash, x1.hashCode);
    _$hash = $jc(_$hash, y1.hashCode);
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutTokenDto')
          ..add('blockIndex', blockIndex)
          ..add('page', page)
          ..add('x0', x0)
          ..add('y0', y0)
          ..add('x1', x1)
          ..add('y1', y1)
          ..add('text', text))
        .toString();
  }
}

class LayoutTokenDtoBuilder
    implements Builder<LayoutTokenDto, LayoutTokenDtoBuilder> {
  _$LayoutTokenDto? _$v;

  num? _blockIndex;
  num? get blockIndex => _$this._blockIndex;
  set blockIndex(num? blockIndex) => _$this._blockIndex = blockIndex;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  num? _x0;
  num? get x0 => _$this._x0;
  set x0(num? x0) => _$this._x0 = x0;

  num? _y0;
  num? get y0 => _$this._y0;
  set y0(num? y0) => _$this._y0 = y0;

  num? _x1;
  num? get x1 => _$this._x1;
  set x1(num? x1) => _$this._x1 = x1;

  num? _y1;
  num? get y1 => _$this._y1;
  set y1(num? y1) => _$this._y1 = y1;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  LayoutTokenDtoBuilder() {
    LayoutTokenDto._defaults(this);
  }

  LayoutTokenDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _blockIndex = $v.blockIndex;
      _page = $v.page;
      _x0 = $v.x0;
      _y0 = $v.y0;
      _x1 = $v.x1;
      _y1 = $v.y1;
      _text = $v.text;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutTokenDto other) {
    _$v = other as _$LayoutTokenDto;
  }

  @override
  void update(void Function(LayoutTokenDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutTokenDto build() => _build();

  _$LayoutTokenDto _build() {
    final _$result = _$v ??
        _$LayoutTokenDto._(
          blockIndex: BuiltValueNullFieldError.checkNotNull(
              blockIndex, r'LayoutTokenDto', 'blockIndex'),
          page: BuiltValueNullFieldError.checkNotNull(
              page, r'LayoutTokenDto', 'page'),
          x0: BuiltValueNullFieldError.checkNotNull(
              x0, r'LayoutTokenDto', 'x0'),
          y0: BuiltValueNullFieldError.checkNotNull(
              y0, r'LayoutTokenDto', 'y0'),
          x1: BuiltValueNullFieldError.checkNotNull(
              x1, r'LayoutTokenDto', 'x1'),
          y1: BuiltValueNullFieldError.checkNotNull(
              y1, r'LayoutTokenDto', 'y1'),
          text: BuiltValueNullFieldError.checkNotNull(
              text, r'LayoutTokenDto', 'text'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
