// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extraction_engine_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExtractionEngineListResponseDto
    extends ExtractionEngineListResponseDto {
  @override
  final BuiltList<JsonObject> engines;

  factory _$ExtractionEngineListResponseDto(
          [void Function(ExtractionEngineListResponseDtoBuilder)? updates]) =>
      (ExtractionEngineListResponseDtoBuilder()..update(updates))._build();

  _$ExtractionEngineListResponseDto._({required this.engines}) : super._();
  @override
  ExtractionEngineListResponseDto rebuild(
          void Function(ExtractionEngineListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExtractionEngineListResponseDtoBuilder toBuilder() =>
      ExtractionEngineListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExtractionEngineListResponseDto && engines == other.engines;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, engines.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExtractionEngineListResponseDto')
          ..add('engines', engines))
        .toString();
  }
}

class ExtractionEngineListResponseDtoBuilder
    implements
        Builder<ExtractionEngineListResponseDto,
            ExtractionEngineListResponseDtoBuilder> {
  _$ExtractionEngineListResponseDto? _$v;

  ListBuilder<JsonObject>? _engines;
  ListBuilder<JsonObject> get engines =>
      _$this._engines ??= ListBuilder<JsonObject>();
  set engines(ListBuilder<JsonObject>? engines) => _$this._engines = engines;

  ExtractionEngineListResponseDtoBuilder() {
    ExtractionEngineListResponseDto._defaults(this);
  }

  ExtractionEngineListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _engines = $v.engines.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExtractionEngineListResponseDto other) {
    _$v = other as _$ExtractionEngineListResponseDto;
  }

  @override
  void update(void Function(ExtractionEngineListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExtractionEngineListResponseDto build() => _build();

  _$ExtractionEngineListResponseDto _build() {
    _$ExtractionEngineListResponseDto _$result;
    try {
      _$result = _$v ??
          _$ExtractionEngineListResponseDto._(
            engines: engines.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'engines';
        engines.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ExtractionEngineListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
