// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_tag_suggestions_batch_item_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentTagSuggestionsBatchItemDto
    extends DocumentTagSuggestionsBatchItemDto {
  @override
  final String documentId;
  @override
  final BuiltList<JsonObject> suggestions;

  factory _$DocumentTagSuggestionsBatchItemDto(
          [void Function(DocumentTagSuggestionsBatchItemDtoBuilder)?
              updates]) =>
      (new DocumentTagSuggestionsBatchItemDtoBuilder()..update(updates))
          ._build();

  _$DocumentTagSuggestionsBatchItemDto._(
      {required this.documentId, required this.suggestions})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        documentId, r'DocumentTagSuggestionsBatchItemDto', 'documentId');
    BuiltValueNullFieldError.checkNotNull(
        suggestions, r'DocumentTagSuggestionsBatchItemDto', 'suggestions');
  }

  @override
  DocumentTagSuggestionsBatchItemDto rebuild(
          void Function(DocumentTagSuggestionsBatchItemDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentTagSuggestionsBatchItemDtoBuilder toBuilder() =>
      new DocumentTagSuggestionsBatchItemDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentTagSuggestionsBatchItemDto &&
        documentId == other.documentId &&
        suggestions == other.suggestions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, suggestions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentTagSuggestionsBatchItemDto')
          ..add('documentId', documentId)
          ..add('suggestions', suggestions))
        .toString();
  }
}

class DocumentTagSuggestionsBatchItemDtoBuilder
    implements
        Builder<DocumentTagSuggestionsBatchItemDto,
            DocumentTagSuggestionsBatchItemDtoBuilder> {
  _$DocumentTagSuggestionsBatchItemDto? _$v;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  ListBuilder<JsonObject>? _suggestions;
  ListBuilder<JsonObject> get suggestions =>
      _$this._suggestions ??= new ListBuilder<JsonObject>();
  set suggestions(ListBuilder<JsonObject>? suggestions) =>
      _$this._suggestions = suggestions;

  DocumentTagSuggestionsBatchItemDtoBuilder() {
    DocumentTagSuggestionsBatchItemDto._defaults(this);
  }

  DocumentTagSuggestionsBatchItemDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentId = $v.documentId;
      _suggestions = $v.suggestions.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentTagSuggestionsBatchItemDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentTagSuggestionsBatchItemDto;
  }

  @override
  void update(
      void Function(DocumentTagSuggestionsBatchItemDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentTagSuggestionsBatchItemDto build() => _build();

  _$DocumentTagSuggestionsBatchItemDto _build() {
    _$DocumentTagSuggestionsBatchItemDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentTagSuggestionsBatchItemDto._(
              documentId: BuiltValueNullFieldError.checkNotNull(documentId,
                  r'DocumentTagSuggestionsBatchItemDto', 'documentId'),
              suggestions: suggestions.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'suggestions';
        suggestions.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentTagSuggestionsBatchItemDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
