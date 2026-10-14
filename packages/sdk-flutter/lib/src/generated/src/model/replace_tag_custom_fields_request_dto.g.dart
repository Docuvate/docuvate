// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'replace_tag_custom_fields_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReplaceTagCustomFieldsRequestDto
    extends ReplaceTagCustomFieldsRequestDto {
  @override
  final BuiltList<ReplaceTagCustomFieldItemDto> fields;

  factory _$ReplaceTagCustomFieldsRequestDto(
          [void Function(ReplaceTagCustomFieldsRequestDtoBuilder)? updates]) =>
      (ReplaceTagCustomFieldsRequestDtoBuilder()..update(updates))._build();

  _$ReplaceTagCustomFieldsRequestDto._({required this.fields}) : super._();
  @override
  ReplaceTagCustomFieldsRequestDto rebuild(
          void Function(ReplaceTagCustomFieldsRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceTagCustomFieldsRequestDtoBuilder toBuilder() =>
      ReplaceTagCustomFieldsRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceTagCustomFieldsRequestDto && fields == other.fields;
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
    return (newBuiltValueToStringHelper(r'ReplaceTagCustomFieldsRequestDto')
          ..add('fields', fields))
        .toString();
  }
}

class ReplaceTagCustomFieldsRequestDtoBuilder
    implements
        Builder<ReplaceTagCustomFieldsRequestDto,
            ReplaceTagCustomFieldsRequestDtoBuilder> {
  _$ReplaceTagCustomFieldsRequestDto? _$v;

  ListBuilder<ReplaceTagCustomFieldItemDto>? _fields;
  ListBuilder<ReplaceTagCustomFieldItemDto> get fields =>
      _$this._fields ??= ListBuilder<ReplaceTagCustomFieldItemDto>();
  set fields(ListBuilder<ReplaceTagCustomFieldItemDto>? fields) =>
      _$this._fields = fields;

  ReplaceTagCustomFieldsRequestDtoBuilder() {
    ReplaceTagCustomFieldsRequestDto._defaults(this);
  }

  ReplaceTagCustomFieldsRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fields = $v.fields.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceTagCustomFieldsRequestDto other) {
    _$v = other as _$ReplaceTagCustomFieldsRequestDto;
  }

  @override
  void update(void Function(ReplaceTagCustomFieldsRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceTagCustomFieldsRequestDto build() => _build();

  _$ReplaceTagCustomFieldsRequestDto _build() {
    _$ReplaceTagCustomFieldsRequestDto _$result;
    try {
      _$result = _$v ??
          _$ReplaceTagCustomFieldsRequestDto._(
            fields: fields.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fields';
        fields.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReplaceTagCustomFieldsRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
