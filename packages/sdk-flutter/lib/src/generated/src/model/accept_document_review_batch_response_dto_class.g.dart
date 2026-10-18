// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_document_review_batch_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptDocumentReviewBatchResponseDtoClass
    extends AcceptDocumentReviewBatchResponseDtoClass {
  @override
  final num documentsProcessed;
  @override
  final num acceptedLabels;
  @override
  final num acceptedFields;

  factory _$AcceptDocumentReviewBatchResponseDtoClass(
          [void Function(AcceptDocumentReviewBatchResponseDtoClassBuilder)?
              updates]) =>
      (new AcceptDocumentReviewBatchResponseDtoClassBuilder()..update(updates))
          ._build();

  _$AcceptDocumentReviewBatchResponseDtoClass._(
      {required this.documentsProcessed,
      required this.acceptedLabels,
      required this.acceptedFields})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(documentsProcessed,
        r'AcceptDocumentReviewBatchResponseDtoClass', 'documentsProcessed');
    BuiltValueNullFieldError.checkNotNull(acceptedLabels,
        r'AcceptDocumentReviewBatchResponseDtoClass', 'acceptedLabels');
    BuiltValueNullFieldError.checkNotNull(acceptedFields,
        r'AcceptDocumentReviewBatchResponseDtoClass', 'acceptedFields');
  }

  @override
  AcceptDocumentReviewBatchResponseDtoClass rebuild(
          void Function(AcceptDocumentReviewBatchResponseDtoClassBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptDocumentReviewBatchResponseDtoClassBuilder toBuilder() =>
      new AcceptDocumentReviewBatchResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptDocumentReviewBatchResponseDtoClass &&
        documentsProcessed == other.documentsProcessed &&
        acceptedLabels == other.acceptedLabels &&
        acceptedFields == other.acceptedFields;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentsProcessed.hashCode);
    _$hash = $jc(_$hash, acceptedLabels.hashCode);
    _$hash = $jc(_$hash, acceptedFields.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'AcceptDocumentReviewBatchResponseDtoClass')
          ..add('documentsProcessed', documentsProcessed)
          ..add('acceptedLabels', acceptedLabels)
          ..add('acceptedFields', acceptedFields))
        .toString();
  }
}

class AcceptDocumentReviewBatchResponseDtoClassBuilder
    implements
        Builder<AcceptDocumentReviewBatchResponseDtoClass,
            AcceptDocumentReviewBatchResponseDtoClassBuilder> {
  _$AcceptDocumentReviewBatchResponseDtoClass? _$v;

  num? _documentsProcessed;
  num? get documentsProcessed => _$this._documentsProcessed;
  set documentsProcessed(num? documentsProcessed) =>
      _$this._documentsProcessed = documentsProcessed;

  num? _acceptedLabels;
  num? get acceptedLabels => _$this._acceptedLabels;
  set acceptedLabels(num? acceptedLabels) =>
      _$this._acceptedLabels = acceptedLabels;

  num? _acceptedFields;
  num? get acceptedFields => _$this._acceptedFields;
  set acceptedFields(num? acceptedFields) =>
      _$this._acceptedFields = acceptedFields;

  AcceptDocumentReviewBatchResponseDtoClassBuilder() {
    AcceptDocumentReviewBatchResponseDtoClass._defaults(this);
  }

  AcceptDocumentReviewBatchResponseDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentsProcessed = $v.documentsProcessed;
      _acceptedLabels = $v.acceptedLabels;
      _acceptedFields = $v.acceptedFields;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptDocumentReviewBatchResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AcceptDocumentReviewBatchResponseDtoClass;
  }

  @override
  void update(
      void Function(AcceptDocumentReviewBatchResponseDtoClassBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptDocumentReviewBatchResponseDtoClass build() => _build();

  _$AcceptDocumentReviewBatchResponseDtoClass _build() {
    final _$result = _$v ??
        new _$AcceptDocumentReviewBatchResponseDtoClass._(
            documentsProcessed: BuiltValueNullFieldError.checkNotNull(
                documentsProcessed,
                r'AcceptDocumentReviewBatchResponseDtoClass',
                'documentsProcessed'),
            acceptedLabels: BuiltValueNullFieldError.checkNotNull(
                acceptedLabels,
                r'AcceptDocumentReviewBatchResponseDtoClass',
                'acceptedLabels'),
            acceptedFields: BuiltValueNullFieldError.checkNotNull(
                acceptedFields,
                r'AcceptDocumentReviewBatchResponseDtoClass',
                'acceptedFields'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
