// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_extraction_image_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentExtractionImageDtoKindEnum
    _$documentExtractionImageDtoKindEnum_embedded =
    const DocumentExtractionImageDtoKindEnum._('embedded');
const DocumentExtractionImageDtoKindEnum
    _$documentExtractionImageDtoKindEnum_figure =
    const DocumentExtractionImageDtoKindEnum._('figure');

DocumentExtractionImageDtoKindEnum _$documentExtractionImageDtoKindEnumValueOf(
    String name) {
  switch (name) {
    case 'embedded':
      return _$documentExtractionImageDtoKindEnum_embedded;
    case 'figure':
      return _$documentExtractionImageDtoKindEnum_figure;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentExtractionImageDtoKindEnum>
    _$documentExtractionImageDtoKindEnumValues = new BuiltSet<
        DocumentExtractionImageDtoKindEnum>(const <DocumentExtractionImageDtoKindEnum>[
  _$documentExtractionImageDtoKindEnum_embedded,
  _$documentExtractionImageDtoKindEnum_figure,
]);

Serializer<DocumentExtractionImageDtoKindEnum>
    _$documentExtractionImageDtoKindEnumSerializer =
    new _$DocumentExtractionImageDtoKindEnumSerializer();

class _$DocumentExtractionImageDtoKindEnumSerializer
    implements PrimitiveSerializer<DocumentExtractionImageDtoKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'embedded': 'embedded',
    'figure': 'figure',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'embedded': 'embedded',
    'figure': 'figure',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentExtractionImageDtoKindEnum];
  @override
  final String wireName = 'DocumentExtractionImageDtoKindEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentExtractionImageDtoKindEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentExtractionImageDtoKindEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentExtractionImageDtoKindEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentExtractionImageDto extends DocumentExtractionImageDto {
  @override
  final String id;
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
  final DocumentExtractionImageDtoKindEnum kind;
  @override
  final String? caption;

  factory _$DocumentExtractionImageDto(
          [void Function(DocumentExtractionImageDtoBuilder)? updates]) =>
      (new DocumentExtractionImageDtoBuilder()..update(updates))._build();

  _$DocumentExtractionImageDto._(
      {required this.id,
      required this.page,
      required this.x,
      required this.y,
      required this.width,
      required this.height,
      required this.kind,
      this.caption})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'DocumentExtractionImageDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        page, r'DocumentExtractionImageDto', 'page');
    BuiltValueNullFieldError.checkNotNull(
        x, r'DocumentExtractionImageDto', 'x');
    BuiltValueNullFieldError.checkNotNull(
        y, r'DocumentExtractionImageDto', 'y');
    BuiltValueNullFieldError.checkNotNull(
        width, r'DocumentExtractionImageDto', 'width');
    BuiltValueNullFieldError.checkNotNull(
        height, r'DocumentExtractionImageDto', 'height');
    BuiltValueNullFieldError.checkNotNull(
        kind, r'DocumentExtractionImageDto', 'kind');
  }

  @override
  DocumentExtractionImageDto rebuild(
          void Function(DocumentExtractionImageDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentExtractionImageDtoBuilder toBuilder() =>
      new DocumentExtractionImageDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentExtractionImageDto &&
        id == other.id &&
        page == other.page &&
        x == other.x &&
        y == other.y &&
        width == other.width &&
        height == other.height &&
        kind == other.kind &&
        caption == other.caption;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, x.hashCode);
    _$hash = $jc(_$hash, y.hashCode);
    _$hash = $jc(_$hash, width.hashCode);
    _$hash = $jc(_$hash, height.hashCode);
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, caption.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentExtractionImageDto')
          ..add('id', id)
          ..add('page', page)
          ..add('x', x)
          ..add('y', y)
          ..add('width', width)
          ..add('height', height)
          ..add('kind', kind)
          ..add('caption', caption))
        .toString();
  }
}

class DocumentExtractionImageDtoBuilder
    implements
        Builder<DocumentExtractionImageDto, DocumentExtractionImageDtoBuilder> {
  _$DocumentExtractionImageDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

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

  DocumentExtractionImageDtoKindEnum? _kind;
  DocumentExtractionImageDtoKindEnum? get kind => _$this._kind;
  set kind(DocumentExtractionImageDtoKindEnum? kind) => _$this._kind = kind;

  String? _caption;
  String? get caption => _$this._caption;
  set caption(String? caption) => _$this._caption = caption;

  DocumentExtractionImageDtoBuilder() {
    DocumentExtractionImageDto._defaults(this);
  }

  DocumentExtractionImageDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _page = $v.page;
      _x = $v.x;
      _y = $v.y;
      _width = $v.width;
      _height = $v.height;
      _kind = $v.kind;
      _caption = $v.caption;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentExtractionImageDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentExtractionImageDto;
  }

  @override
  void update(void Function(DocumentExtractionImageDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentExtractionImageDto build() => _build();

  _$DocumentExtractionImageDto _build() {
    final _$result = _$v ??
        new _$DocumentExtractionImageDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DocumentExtractionImageDto', 'id'),
            page: BuiltValueNullFieldError.checkNotNull(
                page, r'DocumentExtractionImageDto', 'page'),
            x: BuiltValueNullFieldError.checkNotNull(
                x, r'DocumentExtractionImageDto', 'x'),
            y: BuiltValueNullFieldError.checkNotNull(
                y, r'DocumentExtractionImageDto', 'y'),
            width: BuiltValueNullFieldError.checkNotNull(
                width, r'DocumentExtractionImageDto', 'width'),
            height: BuiltValueNullFieldError.checkNotNull(
                height, r'DocumentExtractionImageDto', 'height'),
            kind: BuiltValueNullFieldError.checkNotNull(
                kind, r'DocumentExtractionImageDto', 'kind'),
            caption: caption);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
