// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_field_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentRegionFieldDto extends DocumentRegionFieldDto {
  @override
  final String fieldKey;
  @override
  final String valueOverride;

  factory _$DocumentRegionFieldDto(
          [void Function(DocumentRegionFieldDtoBuilder)? updates]) =>
      (new DocumentRegionFieldDtoBuilder()..update(updates))._build();

  _$DocumentRegionFieldDto._(
      {required this.fieldKey, required this.valueOverride})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        fieldKey, r'DocumentRegionFieldDto', 'fieldKey');
    BuiltValueNullFieldError.checkNotNull(
        valueOverride, r'DocumentRegionFieldDto', 'valueOverride');
  }

  @override
  DocumentRegionFieldDto rebuild(
          void Function(DocumentRegionFieldDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionFieldDtoBuilder toBuilder() =>
      new DocumentRegionFieldDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionFieldDto &&
        fieldKey == other.fieldKey &&
        valueOverride == other.valueOverride;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fieldKey.hashCode);
    _$hash = $jc(_$hash, valueOverride.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionFieldDto')
          ..add('fieldKey', fieldKey)
          ..add('valueOverride', valueOverride))
        .toString();
  }
}

class DocumentRegionFieldDtoBuilder
    implements Builder<DocumentRegionFieldDto, DocumentRegionFieldDtoBuilder> {
  _$DocumentRegionFieldDto? _$v;

  String? _fieldKey;
  String? get fieldKey => _$this._fieldKey;
  set fieldKey(String? fieldKey) => _$this._fieldKey = fieldKey;

  String? _valueOverride;
  String? get valueOverride => _$this._valueOverride;
  set valueOverride(String? valueOverride) =>
      _$this._valueOverride = valueOverride;

  DocumentRegionFieldDtoBuilder() {
    DocumentRegionFieldDto._defaults(this);
  }

  DocumentRegionFieldDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fieldKey = $v.fieldKey;
      _valueOverride = $v.valueOverride;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionFieldDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentRegionFieldDto;
  }

  @override
  void update(void Function(DocumentRegionFieldDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionFieldDto build() => _build();

  _$DocumentRegionFieldDto _build() {
    final _$result = _$v ??
        new _$DocumentRegionFieldDto._(
            fieldKey: BuiltValueNullFieldError.checkNotNull(
                fieldKey, r'DocumentRegionFieldDto', 'fieldKey'),
            valueOverride: BuiltValueNullFieldError.checkNotNull(
                valueOverride, r'DocumentRegionFieldDto', 'valueOverride'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
