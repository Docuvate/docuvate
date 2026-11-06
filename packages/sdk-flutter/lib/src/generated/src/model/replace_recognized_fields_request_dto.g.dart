// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'replace_recognized_fields_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReplaceRecognizedFieldsRequestDto
    extends ReplaceRecognizedFieldsRequestDto {
  @override
  final BuiltList<ReplaceRecognizedFieldItemDto> fields;

  factory _$ReplaceRecognizedFieldsRequestDto(
          [void Function(ReplaceRecognizedFieldsRequestDtoBuilder)? updates]) =>
      (ReplaceRecognizedFieldsRequestDtoBuilder()..update(updates))._build();

  _$ReplaceRecognizedFieldsRequestDto._({required this.fields}) : super._();
  @override
  ReplaceRecognizedFieldsRequestDto rebuild(
          void Function(ReplaceRecognizedFieldsRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceRecognizedFieldsRequestDtoBuilder toBuilder() =>
      ReplaceRecognizedFieldsRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceRecognizedFieldsRequestDto && fields == other.fields;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fields.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceRecognizedFieldsRequestDto')
          ..add('fields', fields))
        .toString();
  }
}

class ReplaceRecognizedFieldsRequestDtoBuilder
    implements
        Builder<ReplaceRecognizedFieldsRequestDto,
            ReplaceRecognizedFieldsRequestDtoBuilder> {
  _$ReplaceRecognizedFieldsRequestDto? _$v;

  ListBuilder<ReplaceRecognizedFieldItemDto>? _fields;
  ListBuilder<ReplaceRecognizedFieldItemDto> get fields =>
      _$this._fields ??= ListBuilder<ReplaceRecognizedFieldItemDto>();
  set fields(ListBuilder<ReplaceRecognizedFieldItemDto>? fields) =>
      _$this._fields = fields;

  ReplaceRecognizedFieldsRequestDtoBuilder() {
    ReplaceRecognizedFieldsRequestDto._defaults(this);
  }

  ReplaceRecognizedFieldsRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fields = $v.fields.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceRecognizedFieldsRequestDto other) {
    _$v = other as _$ReplaceRecognizedFieldsRequestDto;
  }

  @override
  void update(
      void Function(ReplaceRecognizedFieldsRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceRecognizedFieldsRequestDto build() => _build();

  _$ReplaceRecognizedFieldsRequestDto _build() {
    _$ReplaceRecognizedFieldsRequestDto _$result;
    try {
      _$result = _$v ??
          _$ReplaceRecognizedFieldsRequestDto._(
            fields: fields.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fields';
        fields.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReplaceRecognizedFieldsRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
