// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_document_view_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedDocumentViewListResponseDto
    extends SavedDocumentViewListResponseDto {
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;
  @override
  final BuiltList<SavedDocumentViewDtoClass> items;

  factory _$SavedDocumentViewListResponseDto(
          [void Function(SavedDocumentViewListResponseDtoBuilder)? updates]) =>
      (new SavedDocumentViewListResponseDtoBuilder()..update(updates))._build();

  _$SavedDocumentViewListResponseDto._(
      {required this.nextCursor,
      required this.hasMore,
      required this.total,
      required this.items})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'SavedDocumentViewListResponseDto', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'SavedDocumentViewListResponseDto', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'SavedDocumentViewListResponseDto', 'total');
    BuiltValueNullFieldError.checkNotNull(
        items, r'SavedDocumentViewListResponseDto', 'items');
  }

  @override
  SavedDocumentViewListResponseDto rebuild(
          void Function(SavedDocumentViewListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedDocumentViewListResponseDtoBuilder toBuilder() =>
      new SavedDocumentViewListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedDocumentViewListResponseDto &&
        nextCursor == other.nextCursor &&
        hasMore == other.hasMore &&
        total == other.total &&
        items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SavedDocumentViewListResponseDto')
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total)
          ..add('items', items))
        .toString();
  }
}

class SavedDocumentViewListResponseDtoBuilder
    implements
        Builder<SavedDocumentViewListResponseDto,
            SavedDocumentViewListResponseDtoBuilder> {
  _$SavedDocumentViewListResponseDto? _$v;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  ListBuilder<SavedDocumentViewDtoClass>? _items;
  ListBuilder<SavedDocumentViewDtoClass> get items =>
      _$this._items ??= new ListBuilder<SavedDocumentViewDtoClass>();
  set items(ListBuilder<SavedDocumentViewDtoClass>? items) =>
      _$this._items = items;

  SavedDocumentViewListResponseDtoBuilder() {
    SavedDocumentViewListResponseDto._defaults(this);
  }

  SavedDocumentViewListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _nextCursor = $v.nextCursor;
      _hasMore = $v.hasMore;
      _total = $v.total;
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedDocumentViewListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SavedDocumentViewListResponseDto;
  }

  @override
  void update(void Function(SavedDocumentViewListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedDocumentViewListResponseDto build() => _build();

  _$SavedDocumentViewListResponseDto _build() {
    _$SavedDocumentViewListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$SavedDocumentViewListResponseDto._(
              nextCursor: BuiltValueNullFieldError.checkNotNull(nextCursor,
                  r'SavedDocumentViewListResponseDto', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'SavedDocumentViewListResponseDto', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'SavedDocumentViewListResponseDto', 'total'),
              items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'SavedDocumentViewListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
