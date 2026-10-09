// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_pipeline_modules_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentPipelineModulesResponseDto
    extends DocumentPipelineModulesResponseDto {
  @override
  final BuiltList<DocumentPipelineModuleDescriptorDto> modules;

  factory _$DocumentPipelineModulesResponseDto(
          [void Function(DocumentPipelineModulesResponseDtoBuilder)?
              updates]) =>
      (new DocumentPipelineModulesResponseDtoBuilder()..update(updates))
          ._build();

  _$DocumentPipelineModulesResponseDto._({required this.modules}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        modules, r'DocumentPipelineModulesResponseDto', 'modules');
  }

  @override
  DocumentPipelineModulesResponseDto rebuild(
          void Function(DocumentPipelineModulesResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentPipelineModulesResponseDtoBuilder toBuilder() =>
      new DocumentPipelineModulesResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentPipelineModulesResponseDto &&
        modules == other.modules;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, modules.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentPipelineModulesResponseDto')
          ..add('modules', modules))
        .toString();
  }
}

class DocumentPipelineModulesResponseDtoBuilder
    implements
        Builder<DocumentPipelineModulesResponseDto,
            DocumentPipelineModulesResponseDtoBuilder> {
  _$DocumentPipelineModulesResponseDto? _$v;

  ListBuilder<DocumentPipelineModuleDescriptorDto>? _modules;
  ListBuilder<DocumentPipelineModuleDescriptorDto> get modules =>
      _$this._modules ??=
          new ListBuilder<DocumentPipelineModuleDescriptorDto>();
  set modules(ListBuilder<DocumentPipelineModuleDescriptorDto>? modules) =>
      _$this._modules = modules;

  DocumentPipelineModulesResponseDtoBuilder() {
    DocumentPipelineModulesResponseDto._defaults(this);
  }

  DocumentPipelineModulesResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _modules = $v.modules.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentPipelineModulesResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentPipelineModulesResponseDto;
  }

  @override
  void update(
      void Function(DocumentPipelineModulesResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentPipelineModulesResponseDto build() => _build();

  _$DocumentPipelineModulesResponseDto _build() {
    _$DocumentPipelineModulesResponseDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentPipelineModulesResponseDto._(modules: modules.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'modules';
        modules.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentPipelineModulesResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
