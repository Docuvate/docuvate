// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_tag_suggestions_batch_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentTagSuggestionsBatchResponseDto
    extends DocumentTagSuggestionsBatchResponseDto {
  @override
  final BuiltList<DocumentTagSuggestionsBatchItemDto> items;

  factory _$DocumentTagSuggestionsBatchResponseDto(
          [void Function(DocumentTagSuggestionsBatchResponseDtoBuilder)?
              updates]) =>
      (new DocumentTagSuggestionsBatchResponseDtoBuilder()..update(updates))
          ._build();

  _$DocumentTagSuggestionsBatchResponseDto._({required this.items})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'DocumentTagSuggestionsBatchResponseDto', 'items');
  }

  @override
  DocumentTagSuggestionsBatchResponseDto rebuild(
          void Function(DocumentTagSuggestionsBatchResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentTagSuggestionsBatchResponseDtoBuilder toBuilder() =>
      new DocumentTagSuggestionsBatchResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentTagSuggestionsBatchResponseDto &&
        items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentTagSuggestionsBatchResponseDto')
          ..add('items', items))
        .toString();
  }
}

class DocumentTagSuggestionsBatchResponseDtoBuilder
    implements
        Builder<DocumentTagSuggestionsBatchResponseDto,
            DocumentTagSuggestionsBatchResponseDtoBuilder> {
  _$DocumentTagSuggestionsBatchResponseDto? _$v;

  ListBuilder<DocumentTagSuggestionsBatchItemDto>? _items;
  ListBuilder<DocumentTagSuggestionsBatchItemDto> get items =>
      _$this._items ??= new ListBuilder<DocumentTagSuggestionsBatchItemDto>();
  set items(ListBuilder<DocumentTagSuggestionsBatchItemDto>? items) =>
      _$this._items = items;

  DocumentTagSuggestionsBatchResponseDtoBuilder() {
    DocumentTagSuggestionsBatchResponseDto._defaults(this);
  }

  DocumentTagSuggestionsBatchResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentTagSuggestionsBatchResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentTagSuggestionsBatchResponseDto;
  }

  @override
  void update(
      void Function(DocumentTagSuggestionsBatchResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentTagSuggestionsBatchResponseDto build() => _build();

  _$DocumentTagSuggestionsBatchResponseDto _build() {
    _$DocumentTagSuggestionsBatchResponseDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentTagSuggestionsBatchResponseDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentTagSuggestionsBatchResponseDto',
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
