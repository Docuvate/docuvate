// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extracted_field_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExtractedFieldDto extends ExtractedFieldDto {
  @override
  final String key;
  @override
  final String value;
  @override
  final num? confidence;

  factory _$ExtractedFieldDto(
          [void Function(ExtractedFieldDtoBuilder)? updates]) =>
      (ExtractedFieldDtoBuilder()..update(updates))._build();

  _$ExtractedFieldDto._(
      {required this.key, required this.value, this.confidence})
      : super._();
  @override
  ExtractedFieldDto rebuild(void Function(ExtractedFieldDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExtractedFieldDtoBuilder toBuilder() =>
      ExtractedFieldDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExtractedFieldDto &&
        key == other.key &&
        value == other.value &&
        confidence == other.confidence;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, key.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jc(_$hash, confidence.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExtractedFieldDto')
          ..add('key', key)
          ..add('value', value)
          ..add('confidence', confidence))
        .toString();
  }
}

class ExtractedFieldDtoBuilder
    implements Builder<ExtractedFieldDto, ExtractedFieldDtoBuilder> {
  _$ExtractedFieldDto? _$v;

  String? _key;
  String? get key => _$this._key;
  set key(String? key) => _$this._key = key;

  String? _value;
  String? get value => _$this._value;
  set value(String? value) => _$this._value = value;

  num? _confidence;
  num? get confidence => _$this._confidence;
  set confidence(num? confidence) => _$this._confidence = confidence;

  ExtractedFieldDtoBuilder() {
    ExtractedFieldDto._defaults(this);
  }

  ExtractedFieldDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _key = $v.key;
      _value = $v.value;
      _confidence = $v.confidence;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExtractedFieldDto other) {
    _$v = other as _$ExtractedFieldDto;
  }

  @override
  void update(void Function(ExtractedFieldDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExtractedFieldDto build() => _build();

  _$ExtractedFieldDto _build() {
    final _$result = _$v ??
        _$ExtractedFieldDto._(
          key: BuiltValueNullFieldError.checkNotNull(
              key, r'ExtractedFieldDto', 'key'),
          value: BuiltValueNullFieldError.checkNotNull(
              value, r'ExtractedFieldDto', 'value'),
          confidence: confidence,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
