// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_document_review_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptDocumentReviewResponseDtoClass
    extends AcceptDocumentReviewResponseDtoClass {
  @override
  final String documentId;
  @override
  final num acceptedLabels;
  @override
  final num acceptedFields;

  factory _$AcceptDocumentReviewResponseDtoClass(
          [void Function(AcceptDocumentReviewResponseDtoClassBuilder)?
              updates]) =>
      (new AcceptDocumentReviewResponseDtoClassBuilder()..update(updates))
          ._build();

  _$AcceptDocumentReviewResponseDtoClass._(
      {required this.documentId,
      required this.acceptedLabels,
      required this.acceptedFields})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        documentId, r'AcceptDocumentReviewResponseDtoClass', 'documentId');
    BuiltValueNullFieldError.checkNotNull(acceptedLabels,
        r'AcceptDocumentReviewResponseDtoClass', 'acceptedLabels');
    BuiltValueNullFieldError.checkNotNull(acceptedFields,
        r'AcceptDocumentReviewResponseDtoClass', 'acceptedFields');
  }

  @override
  AcceptDocumentReviewResponseDtoClass rebuild(
          void Function(AcceptDocumentReviewResponseDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptDocumentReviewResponseDtoClassBuilder toBuilder() =>
      new AcceptDocumentReviewResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptDocumentReviewResponseDtoClass &&
        documentId == other.documentId &&
        acceptedLabels == other.acceptedLabels &&
        acceptedFields == other.acceptedFields;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, acceptedLabels.hashCode);
    _$hash = $jc(_$hash, acceptedFields.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AcceptDocumentReviewResponseDtoClass')
          ..add('documentId', documentId)
          ..add('acceptedLabels', acceptedLabels)
          ..add('acceptedFields', acceptedFields))
        .toString();
  }
}

class AcceptDocumentReviewResponseDtoClassBuilder
    implements
        Builder<AcceptDocumentReviewResponseDtoClass,
            AcceptDocumentReviewResponseDtoClassBuilder> {
  _$AcceptDocumentReviewResponseDtoClass? _$v;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  num? _acceptedLabels;
  num? get acceptedLabels => _$this._acceptedLabels;
  set acceptedLabels(num? acceptedLabels) =>
      _$this._acceptedLabels = acceptedLabels;

  num? _acceptedFields;
  num? get acceptedFields => _$this._acceptedFields;
  set acceptedFields(num? acceptedFields) =>
      _$this._acceptedFields = acceptedFields;

  AcceptDocumentReviewResponseDtoClassBuilder() {
    AcceptDocumentReviewResponseDtoClass._defaults(this);
  }

  AcceptDocumentReviewResponseDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentId = $v.documentId;
      _acceptedLabels = $v.acceptedLabels;
      _acceptedFields = $v.acceptedFields;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptDocumentReviewResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AcceptDocumentReviewResponseDtoClass;
  }

  @override
  void update(
      void Function(AcceptDocumentReviewResponseDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptDocumentReviewResponseDtoClass build() => _build();

  _$AcceptDocumentReviewResponseDtoClass _build() {
    final _$result = _$v ??
        new _$AcceptDocumentReviewResponseDtoClass._(
            documentId: BuiltValueNullFieldError.checkNotNull(documentId,
                r'AcceptDocumentReviewResponseDtoClass', 'documentId'),
            acceptedLabels: BuiltValueNullFieldError.checkNotNull(
                acceptedLabels,
                r'AcceptDocumentReviewResponseDtoClass',
                'acceptedLabels'),
            acceptedFields: BuiltValueNullFieldError.checkNotNull(
                acceptedFields,
                r'AcceptDocumentReviewResponseDtoClass',
                'acceptedFields'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
