// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_providers_catalog_meta_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatProvidersCatalogMetaDto
    extends DocumentChatProvidersCatalogMetaDto {
  @override
  final String ollamaModel;
  @override
  final bool ollamaConfigured;
  @override
  final bool runsOnCpu;

  factory _$DocumentChatProvidersCatalogMetaDto(
          [void Function(DocumentChatProvidersCatalogMetaDtoBuilder)?
              updates]) =>
      (DocumentChatProvidersCatalogMetaDtoBuilder()..update(updates))._build();

  _$DocumentChatProvidersCatalogMetaDto._(
      {required this.ollamaModel,
      required this.ollamaConfigured,
      required this.runsOnCpu})
      : super._();
  @override
  DocumentChatProvidersCatalogMetaDto rebuild(
          void Function(DocumentChatProvidersCatalogMetaDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatProvidersCatalogMetaDtoBuilder toBuilder() =>
      DocumentChatProvidersCatalogMetaDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatProvidersCatalogMetaDto &&
        ollamaModel == other.ollamaModel &&
        ollamaConfigured == other.ollamaConfigured &&
        runsOnCpu == other.runsOnCpu;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ollamaModel.hashCode);
    _$hash = $jc(_$hash, ollamaConfigured.hashCode);
    _$hash = $jc(_$hash, runsOnCpu.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatProvidersCatalogMetaDto')
          ..add('ollamaModel', ollamaModel)
          ..add('ollamaConfigured', ollamaConfigured)
          ..add('runsOnCpu', runsOnCpu))
        .toString();
  }
}

class DocumentChatProvidersCatalogMetaDtoBuilder
    implements
        Builder<DocumentChatProvidersCatalogMetaDto,
            DocumentChatProvidersCatalogMetaDtoBuilder> {
  _$DocumentChatProvidersCatalogMetaDto? _$v;

  String? _ollamaModel;
  String? get ollamaModel => _$this._ollamaModel;
  set ollamaModel(String? ollamaModel) => _$this._ollamaModel = ollamaModel;

  bool? _ollamaConfigured;
  bool? get ollamaConfigured => _$this._ollamaConfigured;
  set ollamaConfigured(bool? ollamaConfigured) =>
      _$this._ollamaConfigured = ollamaConfigured;

  bool? _runsOnCpu;
  bool? get runsOnCpu => _$this._runsOnCpu;
  set runsOnCpu(bool? runsOnCpu) => _$this._runsOnCpu = runsOnCpu;

  DocumentChatProvidersCatalogMetaDtoBuilder() {
    DocumentChatProvidersCatalogMetaDto._defaults(this);
  }

  DocumentChatProvidersCatalogMetaDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ollamaModel = $v.ollamaModel;
      _ollamaConfigured = $v.ollamaConfigured;
      _runsOnCpu = $v.runsOnCpu;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatProvidersCatalogMetaDto other) {
    _$v = other as _$DocumentChatProvidersCatalogMetaDto;
  }

  @override
  void update(
      void Function(DocumentChatProvidersCatalogMetaDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatProvidersCatalogMetaDto build() => _build();

  _$DocumentChatProvidersCatalogMetaDto _build() {
    final _$result = _$v ??
        _$DocumentChatProvidersCatalogMetaDto._(
          ollamaModel: BuiltValueNullFieldError.checkNotNull(ollamaModel,
              r'DocumentChatProvidersCatalogMetaDto', 'ollamaModel'),
          ollamaConfigured: BuiltValueNullFieldError.checkNotNull(
              ollamaConfigured,
              r'DocumentChatProvidersCatalogMetaDto',
              'ollamaConfigured'),
          runsOnCpu: BuiltValueNullFieldError.checkNotNull(
              runsOnCpu, r'DocumentChatProvidersCatalogMetaDto', 'runsOnCpu'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
