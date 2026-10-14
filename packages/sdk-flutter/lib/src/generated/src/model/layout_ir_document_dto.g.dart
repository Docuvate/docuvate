// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_document_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LayoutIrDocumentDtoVersionEnum _$layoutIrDocumentDtoVersionEnum_n1 =
    const LayoutIrDocumentDtoVersionEnum._('n1');

LayoutIrDocumentDtoVersionEnum _$layoutIrDocumentDtoVersionEnumValueOf(
    String name) {
  switch (name) {
    case 'n1':
      return _$layoutIrDocumentDtoVersionEnum_n1;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LayoutIrDocumentDtoVersionEnum>
    _$layoutIrDocumentDtoVersionEnumValues = BuiltSet<
        LayoutIrDocumentDtoVersionEnum>(const <LayoutIrDocumentDtoVersionEnum>[
  _$layoutIrDocumentDtoVersionEnum_n1,
]);

Serializer<LayoutIrDocumentDtoVersionEnum>
    _$layoutIrDocumentDtoVersionEnumSerializer =
    _$LayoutIrDocumentDtoVersionEnumSerializer();

class _$LayoutIrDocumentDtoVersionEnumSerializer
    implements PrimitiveSerializer<LayoutIrDocumentDtoVersionEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'n1': '1',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    '1': 'n1',
  };

  @override
  final Iterable<Type> types = const <Type>[LayoutIrDocumentDtoVersionEnum];
  @override
  final String wireName = 'LayoutIrDocumentDtoVersionEnum';

  @override
  Object serialize(
          Serializers serializers, LayoutIrDocumentDtoVersionEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LayoutIrDocumentDtoVersionEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LayoutIrDocumentDtoVersionEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LayoutIrDocumentDto extends LayoutIrDocumentDto {
  @override
  final LayoutIrDocumentDtoVersionEnum version;
  @override
  final BuiltList<LayoutIrPageDto> pages;

  factory _$LayoutIrDocumentDto(
          [void Function(LayoutIrDocumentDtoBuilder)? updates]) =>
      (LayoutIrDocumentDtoBuilder()..update(updates))._build();

  _$LayoutIrDocumentDto._({required this.version, required this.pages})
      : super._();
  @override
  LayoutIrDocumentDto rebuild(
          void Function(LayoutIrDocumentDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrDocumentDtoBuilder toBuilder() =>
      LayoutIrDocumentDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrDocumentDto &&
        version == other.version &&
        pages == other.pages;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, version.hashCode);
    _$hash = $jc(_$hash, pages.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrDocumentDto')
          ..add('version', version)
          ..add('pages', pages))
        .toString();
  }
}

class LayoutIrDocumentDtoBuilder
    implements Builder<LayoutIrDocumentDto, LayoutIrDocumentDtoBuilder> {
  _$LayoutIrDocumentDto? _$v;

  LayoutIrDocumentDtoVersionEnum? _version;
  LayoutIrDocumentDtoVersionEnum? get version => _$this._version;
  set version(LayoutIrDocumentDtoVersionEnum? version) =>
      _$this._version = version;

  ListBuilder<LayoutIrPageDto>? _pages;
  ListBuilder<LayoutIrPageDto> get pages =>
      _$this._pages ??= ListBuilder<LayoutIrPageDto>();
  set pages(ListBuilder<LayoutIrPageDto>? pages) => _$this._pages = pages;

  LayoutIrDocumentDtoBuilder() {
    LayoutIrDocumentDto._defaults(this);
  }

  LayoutIrDocumentDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _version = $v.version;
      _pages = $v.pages.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrDocumentDto other) {
    _$v = other as _$LayoutIrDocumentDto;
  }

  @override
  void update(void Function(LayoutIrDocumentDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrDocumentDto build() => _build();

  _$LayoutIrDocumentDto _build() {
    _$LayoutIrDocumentDto _$result;
    try {
      _$result = _$v ??
          _$LayoutIrDocumentDto._(
            version: BuiltValueNullFieldError.checkNotNull(
                version, r'LayoutIrDocumentDto', 'version'),
            pages: pages.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'pages';
        pages.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LayoutIrDocumentDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
