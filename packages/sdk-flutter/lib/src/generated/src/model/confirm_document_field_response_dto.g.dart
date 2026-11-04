// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'confirm_document_field_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ConfirmDocumentFieldResponseDto
    extends ConfirmDocumentFieldResponseDto {
  @override
  final bool confirmed;
  @override
  final String fieldKey;
  @override
  final String valueSha256;

  factory _$ConfirmDocumentFieldResponseDto(
          [void Function(ConfirmDocumentFieldResponseDtoBuilder)? updates]) =>
      (new ConfirmDocumentFieldResponseDtoBuilder()..update(updates))._build();

  _$ConfirmDocumentFieldResponseDto._(
      {required this.confirmed,
      required this.fieldKey,
      required this.valueSha256})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        confirmed, r'ConfirmDocumentFieldResponseDto', 'confirmed');
    BuiltValueNullFieldError.checkNotNull(
        fieldKey, r'ConfirmDocumentFieldResponseDto', 'fieldKey');
    BuiltValueNullFieldError.checkNotNull(
        valueSha256, r'ConfirmDocumentFieldResponseDto', 'valueSha256');
  }

  @override
  ConfirmDocumentFieldResponseDto rebuild(
          void Function(ConfirmDocumentFieldResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ConfirmDocumentFieldResponseDtoBuilder toBuilder() =>
      new ConfirmDocumentFieldResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ConfirmDocumentFieldResponseDto &&
        confirmed == other.confirmed &&
        fieldKey == other.fieldKey &&
        valueSha256 == other.valueSha256;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, confirmed.hashCode);
    _$hash = $jc(_$hash, fieldKey.hashCode);
    _$hash = $jc(_$hash, valueSha256.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ConfirmDocumentFieldResponseDto')
          ..add('confirmed', confirmed)
          ..add('fieldKey', fieldKey)
          ..add('valueSha256', valueSha256))
        .toString();
  }
}

class ConfirmDocumentFieldResponseDtoBuilder
    implements
        Builder<ConfirmDocumentFieldResponseDto,
            ConfirmDocumentFieldResponseDtoBuilder> {
  _$ConfirmDocumentFieldResponseDto? _$v;

  bool? _confirmed;
  bool? get confirmed => _$this._confirmed;
  set confirmed(bool? confirmed) => _$this._confirmed = confirmed;

  String? _fieldKey;
  String? get fieldKey => _$this._fieldKey;
  set fieldKey(String? fieldKey) => _$this._fieldKey = fieldKey;

  String? _valueSha256;
  String? get valueSha256 => _$this._valueSha256;
  set valueSha256(String? valueSha256) => _$this._valueSha256 = valueSha256;

  ConfirmDocumentFieldResponseDtoBuilder() {
    ConfirmDocumentFieldResponseDto._defaults(this);
  }

  ConfirmDocumentFieldResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _confirmed = $v.confirmed;
      _fieldKey = $v.fieldKey;
      _valueSha256 = $v.valueSha256;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ConfirmDocumentFieldResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ConfirmDocumentFieldResponseDto;
  }

  @override
  void update(void Function(ConfirmDocumentFieldResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ConfirmDocumentFieldResponseDto build() => _build();

  _$ConfirmDocumentFieldResponseDto _build() {
    final _$result = _$v ??
        new _$ConfirmDocumentFieldResponseDto._(
            confirmed: BuiltValueNullFieldError.checkNotNull(
                confirmed, r'ConfirmDocumentFieldResponseDto', 'confirmed'),
            fieldKey: BuiltValueNullFieldError.checkNotNull(
                fieldKey, r'ConfirmDocumentFieldResponseDto', 'fieldKey'),
            valueSha256: BuiltValueNullFieldError.checkNotNull(valueSha256,
                r'ConfirmDocumentFieldResponseDto', 'valueSha256'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
