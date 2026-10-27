// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentListResponseDto extends DocumentListResponseDto {
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;
  @override
  final DocumentListLibraryUiDto? libraryUi;
  @override
  final BuiltList<JsonObject> items;

  factory _$DocumentListResponseDto(
          [void Function(DocumentListResponseDtoBuilder)? updates]) =>
      (new DocumentListResponseDtoBuilder()..update(updates))._build();

  _$DocumentListResponseDto._(
      {required this.nextCursor,
      required this.hasMore,
      required this.total,
      this.libraryUi,
      required this.items})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'DocumentListResponseDto', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'DocumentListResponseDto', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'DocumentListResponseDto', 'total');
    BuiltValueNullFieldError.checkNotNull(
        items, r'DocumentListResponseDto', 'items');
  }

  @override
  DocumentListResponseDto rebuild(
          void Function(DocumentListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentListResponseDtoBuilder toBuilder() =>
      new DocumentListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentListResponseDto &&
        nextCursor == other.nextCursor &&
        hasMore == other.hasMore &&
        total == other.total &&
        libraryUi == other.libraryUi &&
        items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, libraryUi.hashCode);
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentListResponseDto')
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total)
          ..add('libraryUi', libraryUi)
          ..add('items', items))
        .toString();
  }
}

class DocumentListResponseDtoBuilder
    implements
        Builder<DocumentListResponseDto, DocumentListResponseDtoBuilder> {
  _$DocumentListResponseDto? _$v;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  DocumentListLibraryUiDtoBuilder? _libraryUi;
  DocumentListLibraryUiDtoBuilder get libraryUi =>
      _$this._libraryUi ??= new DocumentListLibraryUiDtoBuilder();
  set libraryUi(DocumentListLibraryUiDtoBuilder? libraryUi) =>
      _$this._libraryUi = libraryUi;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  DocumentListResponseDtoBuilder() {
    DocumentListResponseDto._defaults(this);
  }

  DocumentListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _nextCursor = $v.nextCursor;
      _hasMore = $v.hasMore;
      _total = $v.total;
      _libraryUi = $v.libraryUi?.toBuilder();
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentListResponseDto;
  }

  @override
  void update(void Function(DocumentListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentListResponseDto build() => _build();

  _$DocumentListResponseDto _build() {
    _$DocumentListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentListResponseDto._(
              nextCursor: BuiltValueNullFieldError.checkNotNull(
                  nextCursor, r'DocumentListResponseDto', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'DocumentListResponseDto', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'DocumentListResponseDto', 'total'),
              libraryUi: _libraryUi?.build(),
              items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'libraryUi';
        _libraryUi?.build();
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
