// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'confirm_document_field_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ConfirmDocumentFieldRequestDto extends ConfirmDocumentFieldRequestDto {
  @override
  final String fieldKey;
  @override
  final String value;

  factory _$ConfirmDocumentFieldRequestDto(
          [void Function(ConfirmDocumentFieldRequestDtoBuilder)? updates]) =>
      (new ConfirmDocumentFieldRequestDtoBuilder()..update(updates))._build();

  _$ConfirmDocumentFieldRequestDto._(
      {required this.fieldKey, required this.value})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        fieldKey, r'ConfirmDocumentFieldRequestDto', 'fieldKey');
    BuiltValueNullFieldError.checkNotNull(
        value, r'ConfirmDocumentFieldRequestDto', 'value');
  }

  @override
  ConfirmDocumentFieldRequestDto rebuild(
          void Function(ConfirmDocumentFieldRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ConfirmDocumentFieldRequestDtoBuilder toBuilder() =>
      new ConfirmDocumentFieldRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ConfirmDocumentFieldRequestDto &&
        fieldKey == other.fieldKey &&
        value == other.value;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fieldKey.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ConfirmDocumentFieldRequestDto')
          ..add('fieldKey', fieldKey)
          ..add('value', value))
        .toString();
  }
}

class ConfirmDocumentFieldRequestDtoBuilder
    implements
        Builder<ConfirmDocumentFieldRequestDto,
            ConfirmDocumentFieldRequestDtoBuilder> {
  _$ConfirmDocumentFieldRequestDto? _$v;

  String? _fieldKey;
  String? get fieldKey => _$this._fieldKey;
  set fieldKey(String? fieldKey) => _$this._fieldKey = fieldKey;

  String? _value;
  String? get value => _$this._value;
  set value(String? value) => _$this._value = value;

  ConfirmDocumentFieldRequestDtoBuilder() {
    ConfirmDocumentFieldRequestDto._defaults(this);
  }

  ConfirmDocumentFieldRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fieldKey = $v.fieldKey;
      _value = $v.value;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ConfirmDocumentFieldRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ConfirmDocumentFieldRequestDto;
  }

  @override
  void update(void Function(ConfirmDocumentFieldRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ConfirmDocumentFieldRequestDto build() => _build();

  _$ConfirmDocumentFieldRequestDto _build() {
    final _$result = _$v ??
        new _$ConfirmDocumentFieldRequestDto._(
            fieldKey: BuiltValueNullFieldError.checkNotNull(
                fieldKey, r'ConfirmDocumentFieldRequestDto', 'fieldKey'),
            value: BuiltValueNullFieldError.checkNotNull(
                value, r'ConfirmDocumentFieldRequestDto', 'value'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
