// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_provider_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatProviderListResponseDto
    extends DocumentChatProviderListResponseDto {
  @override
  final BuiltList<DocumentChatProviderInfoDto> selectable;
  @override
  final BuiltList<DocumentChatUnavailableBackendInfoDto> unavailable;
  @override
  final BuiltList<DocumentChatProviderInfoDto>? development;
  @override
  final DocumentChatProvidersCatalogMetaDto meta;

  factory _$DocumentChatProviderListResponseDto(
          [void Function(DocumentChatProviderListResponseDtoBuilder)?
              updates]) =>
      (DocumentChatProviderListResponseDtoBuilder()..update(updates))._build();

  _$DocumentChatProviderListResponseDto._(
      {required this.selectable,
      required this.unavailable,
      this.development,
      required this.meta})
      : super._();
  @override
  DocumentChatProviderListResponseDto rebuild(
          void Function(DocumentChatProviderListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatProviderListResponseDtoBuilder toBuilder() =>
      DocumentChatProviderListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatProviderListResponseDto &&
        selectable == other.selectable &&
        unavailable == other.unavailable &&
        development == other.development &&
        meta == other.meta;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, selectable.hashCode);
    _$hash = $jc(_$hash, unavailable.hashCode);
    _$hash = $jc(_$hash, development.hashCode);
    _$hash = $jc(_$hash, meta.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatProviderListResponseDto')
          ..add('selectable', selectable)
          ..add('unavailable', unavailable)
          ..add('development', development)
          ..add('meta', meta))
        .toString();
  }
}

class DocumentChatProviderListResponseDtoBuilder
    implements
        Builder<DocumentChatProviderListResponseDto,
            DocumentChatProviderListResponseDtoBuilder> {
  _$DocumentChatProviderListResponseDto? _$v;

  ListBuilder<DocumentChatProviderInfoDto>? _selectable;
  ListBuilder<DocumentChatProviderInfoDto> get selectable =>
      _$this._selectable ??= ListBuilder<DocumentChatProviderInfoDto>();
  set selectable(ListBuilder<DocumentChatProviderInfoDto>? selectable) =>
      _$this._selectable = selectable;

  ListBuilder<DocumentChatUnavailableBackendInfoDto>? _unavailable;
  ListBuilder<DocumentChatUnavailableBackendInfoDto> get unavailable =>
      _$this._unavailable ??=
          ListBuilder<DocumentChatUnavailableBackendInfoDto>();
  set unavailable(
          ListBuilder<DocumentChatUnavailableBackendInfoDto>? unavailable) =>
      _$this._unavailable = unavailable;

  ListBuilder<DocumentChatProviderInfoDto>? _development;
  ListBuilder<DocumentChatProviderInfoDto> get development =>
      _$this._development ??= ListBuilder<DocumentChatProviderInfoDto>();
  set development(ListBuilder<DocumentChatProviderInfoDto>? development) =>
      _$this._development = development;

  DocumentChatProvidersCatalogMetaDtoBuilder? _meta;
  DocumentChatProvidersCatalogMetaDtoBuilder get meta =>
      _$this._meta ??= DocumentChatProvidersCatalogMetaDtoBuilder();
  set meta(DocumentChatProvidersCatalogMetaDtoBuilder? meta) =>
      _$this._meta = meta;

  DocumentChatProviderListResponseDtoBuilder() {
    DocumentChatProviderListResponseDto._defaults(this);
  }

  DocumentChatProviderListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _selectable = $v.selectable.toBuilder();
      _unavailable = $v.unavailable.toBuilder();
      _development = $v.development?.toBuilder();
      _meta = $v.meta.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatProviderListResponseDto other) {
    _$v = other as _$DocumentChatProviderListResponseDto;
  }

  @override
  void update(
      void Function(DocumentChatProviderListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatProviderListResponseDto build() => _build();

  _$DocumentChatProviderListResponseDto _build() {
    _$DocumentChatProviderListResponseDto _$result;
    try {
      _$result = _$v ??
          _$DocumentChatProviderListResponseDto._(
            selectable: selectable.build(),
            unavailable: unavailable.build(),
            development: _development?.build(),
            meta: meta.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'selectable';
        selectable.build();
        _$failedField = 'unavailable';
        unavailable.build();
        _$failedField = 'development';
        _development?.build();
        _$failedField = 'meta';
        meta.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(r'DocumentChatProviderListResponseDto',
            _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
