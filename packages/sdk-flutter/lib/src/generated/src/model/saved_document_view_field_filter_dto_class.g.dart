// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_document_view_field_filter_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedDocumentViewFieldFilterDtoClass
    extends SavedDocumentViewFieldFilterDtoClass {
  @override
  final String fieldKey;
  @override
  final String valueText;

  factory _$SavedDocumentViewFieldFilterDtoClass(
          [void Function(SavedDocumentViewFieldFilterDtoClassBuilder)?
              updates]) =>
      (new SavedDocumentViewFieldFilterDtoClassBuilder()..update(updates))
          ._build();

  _$SavedDocumentViewFieldFilterDtoClass._(
      {required this.fieldKey, required this.valueText})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        fieldKey, r'SavedDocumentViewFieldFilterDtoClass', 'fieldKey');
    BuiltValueNullFieldError.checkNotNull(
        valueText, r'SavedDocumentViewFieldFilterDtoClass', 'valueText');
  }

  @override
  SavedDocumentViewFieldFilterDtoClass rebuild(
          void Function(SavedDocumentViewFieldFilterDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedDocumentViewFieldFilterDtoClassBuilder toBuilder() =>
      new SavedDocumentViewFieldFilterDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedDocumentViewFieldFilterDtoClass &&
        fieldKey == other.fieldKey &&
        valueText == other.valueText;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, fieldKey.hashCode);
    _$hash = $jc(_$hash, valueText.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SavedDocumentViewFieldFilterDtoClass')
          ..add('fieldKey', fieldKey)
          ..add('valueText', valueText))
        .toString();
  }
}

class SavedDocumentViewFieldFilterDtoClassBuilder
    implements
        Builder<SavedDocumentViewFieldFilterDtoClass,
            SavedDocumentViewFieldFilterDtoClassBuilder> {
  _$SavedDocumentViewFieldFilterDtoClass? _$v;

  String? _fieldKey;
  String? get fieldKey => _$this._fieldKey;
  set fieldKey(String? fieldKey) => _$this._fieldKey = fieldKey;

  String? _valueText;
  String? get valueText => _$this._valueText;
  set valueText(String? valueText) => _$this._valueText = valueText;

  SavedDocumentViewFieldFilterDtoClassBuilder() {
    SavedDocumentViewFieldFilterDtoClass._defaults(this);
  }

  SavedDocumentViewFieldFilterDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _fieldKey = $v.fieldKey;
      _valueText = $v.valueText;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedDocumentViewFieldFilterDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SavedDocumentViewFieldFilterDtoClass;
  }

  @override
  void update(
      void Function(SavedDocumentViewFieldFilterDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedDocumentViewFieldFilterDtoClass build() => _build();

  _$SavedDocumentViewFieldFilterDtoClass _build() {
    final _$result = _$v ??
        new _$SavedDocumentViewFieldFilterDtoClass._(
            fieldKey: BuiltValueNullFieldError.checkNotNull(
                fieldKey, r'SavedDocumentViewFieldFilterDtoClass', 'fieldKey'),
            valueText: BuiltValueNullFieldError.checkNotNull(valueText,
                r'SavedDocumentViewFieldFilterDtoClass', 'valueText'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
