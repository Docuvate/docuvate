// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_tag_suggestions_batch_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentTagSuggestionsBatchRequestDto
    extends DocumentTagSuggestionsBatchRequestDto {
  @override
  final BuiltList<String> documentIds;

  factory _$DocumentTagSuggestionsBatchRequestDto(
          [void Function(DocumentTagSuggestionsBatchRequestDtoBuilder)?
              updates]) =>
      (new DocumentTagSuggestionsBatchRequestDtoBuilder()..update(updates))
          ._build();

  _$DocumentTagSuggestionsBatchRequestDto._({required this.documentIds})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        documentIds, r'DocumentTagSuggestionsBatchRequestDto', 'documentIds');
  }

  @override
  DocumentTagSuggestionsBatchRequestDto rebuild(
          void Function(DocumentTagSuggestionsBatchRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentTagSuggestionsBatchRequestDtoBuilder toBuilder() =>
      new DocumentTagSuggestionsBatchRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentTagSuggestionsBatchRequestDto &&
        documentIds == other.documentIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentTagSuggestionsBatchRequestDto')
          ..add('documentIds', documentIds))
        .toString();
  }
}

class DocumentTagSuggestionsBatchRequestDtoBuilder
    implements
        Builder<DocumentTagSuggestionsBatchRequestDto,
            DocumentTagSuggestionsBatchRequestDtoBuilder> {
  _$DocumentTagSuggestionsBatchRequestDto? _$v;

  ListBuilder<String>? _documentIds;
  ListBuilder<String> get documentIds =>
      _$this._documentIds ??= new ListBuilder<String>();
  set documentIds(ListBuilder<String>? documentIds) =>
      _$this._documentIds = documentIds;

  DocumentTagSuggestionsBatchRequestDtoBuilder() {
    DocumentTagSuggestionsBatchRequestDto._defaults(this);
  }

  DocumentTagSuggestionsBatchRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentIds = $v.documentIds.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentTagSuggestionsBatchRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentTagSuggestionsBatchRequestDto;
  }

  @override
  void update(
      void Function(DocumentTagSuggestionsBatchRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentTagSuggestionsBatchRequestDto build() => _build();

  _$DocumentTagSuggestionsBatchRequestDto _build() {
    _$DocumentTagSuggestionsBatchRequestDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentTagSuggestionsBatchRequestDto._(
              documentIds: documentIds.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'documentIds';
        documentIds.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentTagSuggestionsBatchRequestDto',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
