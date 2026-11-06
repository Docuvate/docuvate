// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_review_queue_item_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentReviewQueueItemDtoClass
    extends DocumentReviewQueueItemDtoClass {
  @override
  final String documentId;
  @override
  final String title;
  @override
  final String filename;
  @override
  final String? documentDate;
  @override
  final String? suggestedDocumentDate;
  @override
  final String uploadDate;
  @override
  final BuiltList<JsonObject> labelSuggestions;
  @override
  final BuiltList<DocumentReviewFieldSuggestionDtoClass> fieldSuggestions;
  @override
  final DocumentDuplicateStackSummaryDtoClass? duplicateStack;

  factory _$DocumentReviewQueueItemDtoClass(
          [void Function(DocumentReviewQueueItemDtoClassBuilder)? updates]) =>
      (DocumentReviewQueueItemDtoClassBuilder()..update(updates))._build();

  _$DocumentReviewQueueItemDtoClass._(
      {required this.documentId,
      required this.title,
      required this.filename,
      this.documentDate,
      this.suggestedDocumentDate,
      required this.uploadDate,
      required this.labelSuggestions,
      required this.fieldSuggestions,
      this.duplicateStack})
      : super._();
  @override
  DocumentReviewQueueItemDtoClass rebuild(
          void Function(DocumentReviewQueueItemDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentReviewQueueItemDtoClassBuilder toBuilder() =>
      DocumentReviewQueueItemDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentReviewQueueItemDtoClass &&
        documentId == other.documentId &&
        title == other.title &&
        filename == other.filename &&
        documentDate == other.documentDate &&
        suggestedDocumentDate == other.suggestedDocumentDate &&
        uploadDate == other.uploadDate &&
        labelSuggestions == other.labelSuggestions &&
        fieldSuggestions == other.fieldSuggestions &&
        duplicateStack == other.duplicateStack;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, filename.hashCode);
    _$hash = $jc(_$hash, documentDate.hashCode);
    _$hash = $jc(_$hash, suggestedDocumentDate.hashCode);
    _$hash = $jc(_$hash, uploadDate.hashCode);
    _$hash = $jc(_$hash, labelSuggestions.hashCode);
    _$hash = $jc(_$hash, fieldSuggestions.hashCode);
    _$hash = $jc(_$hash, duplicateStack.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentReviewQueueItemDtoClass')
          ..add('documentId', documentId)
          ..add('title', title)
          ..add('filename', filename)
          ..add('documentDate', documentDate)
          ..add('suggestedDocumentDate', suggestedDocumentDate)
          ..add('uploadDate', uploadDate)
          ..add('labelSuggestions', labelSuggestions)
          ..add('fieldSuggestions', fieldSuggestions)
          ..add('duplicateStack', duplicateStack))
        .toString();
  }
}

class DocumentReviewQueueItemDtoClassBuilder
    implements
        Builder<DocumentReviewQueueItemDtoClass,
            DocumentReviewQueueItemDtoClassBuilder> {
  _$DocumentReviewQueueItemDtoClass? _$v;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _filename;
  String? get filename => _$this._filename;
  set filename(String? filename) => _$this._filename = filename;

  String? _documentDate;
  String? get documentDate => _$this._documentDate;
  set documentDate(String? documentDate) => _$this._documentDate = documentDate;

  String? _suggestedDocumentDate;
  String? get suggestedDocumentDate => _$this._suggestedDocumentDate;
  set suggestedDocumentDate(String? suggestedDocumentDate) =>
      _$this._suggestedDocumentDate = suggestedDocumentDate;

  String? _uploadDate;
  String? get uploadDate => _$this._uploadDate;
  set uploadDate(String? uploadDate) => _$this._uploadDate = uploadDate;

  ListBuilder<JsonObject>? _labelSuggestions;
  ListBuilder<JsonObject> get labelSuggestions =>
      _$this._labelSuggestions ??= ListBuilder<JsonObject>();
  set labelSuggestions(ListBuilder<JsonObject>? labelSuggestions) =>
      _$this._labelSuggestions = labelSuggestions;

  ListBuilder<DocumentReviewFieldSuggestionDtoClass>? _fieldSuggestions;
  ListBuilder<DocumentReviewFieldSuggestionDtoClass> get fieldSuggestions =>
      _$this._fieldSuggestions ??=
          ListBuilder<DocumentReviewFieldSuggestionDtoClass>();
  set fieldSuggestions(
          ListBuilder<DocumentReviewFieldSuggestionDtoClass>?
              fieldSuggestions) =>
      _$this._fieldSuggestions = fieldSuggestions;

  DocumentDuplicateStackSummaryDtoClassBuilder? _duplicateStack;
  DocumentDuplicateStackSummaryDtoClassBuilder get duplicateStack =>
      _$this._duplicateStack ??= DocumentDuplicateStackSummaryDtoClassBuilder();
  set duplicateStack(
          DocumentDuplicateStackSummaryDtoClassBuilder? duplicateStack) =>
      _$this._duplicateStack = duplicateStack;

  DocumentReviewQueueItemDtoClassBuilder() {
    DocumentReviewQueueItemDtoClass._defaults(this);
  }

  DocumentReviewQueueItemDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentId = $v.documentId;
      _title = $v.title;
      _filename = $v.filename;
      _documentDate = $v.documentDate;
      _suggestedDocumentDate = $v.suggestedDocumentDate;
      _uploadDate = $v.uploadDate;
      _labelSuggestions = $v.labelSuggestions.toBuilder();
      _fieldSuggestions = $v.fieldSuggestions.toBuilder();
      _duplicateStack = $v.duplicateStack?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentReviewQueueItemDtoClass other) {
    _$v = other as _$DocumentReviewQueueItemDtoClass;
  }

  @override
  void update(void Function(DocumentReviewQueueItemDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentReviewQueueItemDtoClass build() => _build();

  _$DocumentReviewQueueItemDtoClass _build() {
    _$DocumentReviewQueueItemDtoClass _$result;
    try {
      _$result = _$v ??
          _$DocumentReviewQueueItemDtoClass._(
            documentId: BuiltValueNullFieldError.checkNotNull(
                documentId, r'DocumentReviewQueueItemDtoClass', 'documentId'),
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'DocumentReviewQueueItemDtoClass', 'title'),
            filename: BuiltValueNullFieldError.checkNotNull(
                filename, r'DocumentReviewQueueItemDtoClass', 'filename'),
            documentDate: documentDate,
            suggestedDocumentDate: suggestedDocumentDate,
            uploadDate: BuiltValueNullFieldError.checkNotNull(
                uploadDate, r'DocumentReviewQueueItemDtoClass', 'uploadDate'),
            labelSuggestions: labelSuggestions.build(),
            fieldSuggestions: fieldSuggestions.build(),
            duplicateStack: _duplicateStack?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'labelSuggestions';
        labelSuggestions.build();
        _$failedField = 'fieldSuggestions';
        fieldSuggestions.build();
        _$failedField = 'duplicateStack';
        _duplicateStack?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentReviewQueueItemDtoClass', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
