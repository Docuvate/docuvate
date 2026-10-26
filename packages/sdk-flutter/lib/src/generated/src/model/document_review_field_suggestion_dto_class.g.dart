// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_review_field_suggestion_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentReviewFieldSuggestionDtoClass
    extends DocumentReviewFieldSuggestionDtoClass {
  @override
  final String key;
  @override
  final String displayLabel;
  @override
  final String value;
  @override
  final num? confidence;

  factory _$DocumentReviewFieldSuggestionDtoClass(
          [void Function(DocumentReviewFieldSuggestionDtoClassBuilder)?
              updates]) =>
      (new DocumentReviewFieldSuggestionDtoClassBuilder()..update(updates))
          ._build();

  _$DocumentReviewFieldSuggestionDtoClass._(
      {required this.key,
      required this.displayLabel,
      required this.value,
      this.confidence})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        key, r'DocumentReviewFieldSuggestionDtoClass', 'key');
    BuiltValueNullFieldError.checkNotNull(
        displayLabel, r'DocumentReviewFieldSuggestionDtoClass', 'displayLabel');
    BuiltValueNullFieldError.checkNotNull(
        value, r'DocumentReviewFieldSuggestionDtoClass', 'value');
  }

  @override
  DocumentReviewFieldSuggestionDtoClass rebuild(
          void Function(DocumentReviewFieldSuggestionDtoClassBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentReviewFieldSuggestionDtoClassBuilder toBuilder() =>
      new DocumentReviewFieldSuggestionDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentReviewFieldSuggestionDtoClass &&
        key == other.key &&
        displayLabel == other.displayLabel &&
        value == other.value &&
        confidence == other.confidence;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, key.hashCode);
    _$hash = $jc(_$hash, displayLabel.hashCode);
    _$hash = $jc(_$hash, value.hashCode);
    _$hash = $jc(_$hash, confidence.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentReviewFieldSuggestionDtoClass')
          ..add('key', key)
          ..add('displayLabel', displayLabel)
          ..add('value', value)
          ..add('confidence', confidence))
        .toString();
  }
}

class DocumentReviewFieldSuggestionDtoClassBuilder
    implements
        Builder<DocumentReviewFieldSuggestionDtoClass,
            DocumentReviewFieldSuggestionDtoClassBuilder> {
  _$DocumentReviewFieldSuggestionDtoClass? _$v;

  String? _key;
  String? get key => _$this._key;
  set key(String? key) => _$this._key = key;

  String? _displayLabel;
  String? get displayLabel => _$this._displayLabel;
  set displayLabel(String? displayLabel) => _$this._displayLabel = displayLabel;

  String? _value;
  String? get value => _$this._value;
  set value(String? value) => _$this._value = value;

  num? _confidence;
  num? get confidence => _$this._confidence;
  set confidence(num? confidence) => _$this._confidence = confidence;

  DocumentReviewFieldSuggestionDtoClassBuilder() {
    DocumentReviewFieldSuggestionDtoClass._defaults(this);
  }

  DocumentReviewFieldSuggestionDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _key = $v.key;
      _displayLabel = $v.displayLabel;
      _value = $v.value;
      _confidence = $v.confidence;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentReviewFieldSuggestionDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentReviewFieldSuggestionDtoClass;
  }

  @override
  void update(
      void Function(DocumentReviewFieldSuggestionDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentReviewFieldSuggestionDtoClass build() => _build();

  _$DocumentReviewFieldSuggestionDtoClass _build() {
    final _$result = _$v ??
        new _$DocumentReviewFieldSuggestionDtoClass._(
            key: BuiltValueNullFieldError.checkNotNull(
                key, r'DocumentReviewFieldSuggestionDtoClass', 'key'),
            displayLabel: BuiltValueNullFieldError.checkNotNull(displayLabel,
                r'DocumentReviewFieldSuggestionDtoClass', 'displayLabel'),
            value: BuiltValueNullFieldError.checkNotNull(
                value, r'DocumentReviewFieldSuggestionDtoClass', 'value'),
            confidence: confidence);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
