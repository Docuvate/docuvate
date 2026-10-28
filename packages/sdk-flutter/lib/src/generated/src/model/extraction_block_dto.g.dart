// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extraction_block_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExtractionBlockDto extends ExtractionBlockDto {
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
  final num? blockIndex;

  factory _$ExtractionBlockDto(
          [void Function(ExtractionBlockDtoBuilder)? updates]) =>
      (new ExtractionBlockDtoBuilder()..update(updates))._build();

  _$ExtractionBlockDto._(
      {required this.page,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      required this.text,
      this.blockIndex})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(page, r'ExtractionBlockDto', 'page');
    BuiltValueNullFieldError.checkNotNull(x, r'ExtractionBlockDto', 'x');
    BuiltValueNullFieldError.checkNotNull(y, r'ExtractionBlockDto', 'y');
    BuiltValueNullFieldError.checkNotNull(
        width, r'ExtractionBlockDto', 'width');
    BuiltValueNullFieldError.checkNotNull(
        height, r'ExtractionBlockDto', 'height');
    BuiltValueNullFieldError.checkNotNull(text, r'ExtractionBlockDto', 'text');
  }

  @override
  ExtractionBlockDto rebuild(
          void Function(ExtractionBlockDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExtractionBlockDtoBuilder toBuilder() =>
      new ExtractionBlockDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExtractionBlockDto &&
        page == other.page &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        text == other.text &&
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
    _$hash = $jc(_$hash, blockIndex.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExtractionBlockDto')
          ..add('page', page)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('text', text)
          ..add('blockIndex', blockIndex))
        .toString();
  }
}

class ExtractionBlockDtoBuilder
    implements Builder<ExtractionBlockDto, ExtractionBlockDtoBuilder> {
  _$ExtractionBlockDto? _$v;

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

  num? _blockIndex;
  num? get blockIndex => _$this._blockIndex;
  set blockIndex(num? blockIndex) => _$this._blockIndex = blockIndex;

  ExtractionBlockDtoBuilder() {
    ExtractionBlockDto._defaults(this);
  }

  ExtractionBlockDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _page = $v.page;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _text = $v.text;
      _blockIndex = $v.blockIndex;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExtractionBlockDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ExtractionBlockDto;
  }

  @override
  void update(void Function(ExtractionBlockDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExtractionBlockDto build() => _build();

  _$ExtractionBlockDto _build() {
    final _$result = _$v ??
        new _$ExtractionBlockDto._(
            page: BuiltValueNullFieldError.checkNotNull(
                page, r'ExtractionBlockDto', 'page'),
            x: BuiltValueNullFieldError.checkNotNull(
                x, r'ExtractionBlockDto', 'x'),
            y: BuiltValueNullFieldError.checkNotNull(
                y, r'ExtractionBlockDto', 'y'),
            width: BuiltValueNullFieldError.checkNotNull(
                width, r'ExtractionBlockDto', 'width'),
            height: BuiltValueNullFieldError.checkNotNull(
                height, r'ExtractionBlockDto', 'height'),
            text: BuiltValueNullFieldError.checkNotNull(
                text, r'ExtractionBlockDto', 'text'),
            blockIndex: blockIndex);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
