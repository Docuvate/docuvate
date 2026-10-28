// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_search_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagSearchResponseDto extends TagSearchResponseDto {
  @override
  final BuiltList<JsonObject> items;
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;

  factory _$TagSearchResponseDto(
          [void Function(TagSearchResponseDtoBuilder)? updates]) =>
      (new TagSearchResponseDtoBuilder()..update(updates))._build();

  _$TagSearchResponseDto._(
      {required this.items,
      required this.nextCursor,
      required this.hasMore,
      required this.total})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'TagSearchResponseDto', 'items');
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'TagSearchResponseDto', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'TagSearchResponseDto', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'TagSearchResponseDto', 'total');
  }

  @override
  TagSearchResponseDto rebuild(
          void Function(TagSearchResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagSearchResponseDtoBuilder toBuilder() =>
      new TagSearchResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagSearchResponseDto &&
        items == other.items &&
        nextCursor == other.nextCursor &&
        hasMore == other.hasMore &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TagSearchResponseDto')
          ..add('items', items)
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total))
        .toString();
  }
}

class TagSearchResponseDtoBuilder
    implements Builder<TagSearchResponseDto, TagSearchResponseDtoBuilder> {
  _$TagSearchResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  TagSearchResponseDtoBuilder() {
    TagSearchResponseDto._defaults(this);
  }

  TagSearchResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _nextCursor = $v.nextCursor;
      _hasMore = $v.hasMore;
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagSearchResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$TagSearchResponseDto;
  }

  @override
  void update(void Function(TagSearchResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagSearchResponseDto build() => _build();

  _$TagSearchResponseDto _build() {
    _$TagSearchResponseDto _$result;
    try {
      _$result = _$v ??
          new _$TagSearchResponseDto._(
              items: items.build(),
              nextCursor: BuiltValueNullFieldError.checkNotNull(
                  nextCursor, r'TagSearchResponseDto', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'TagSearchResponseDto', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'TagSearchResponseDto', 'total'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'TagSearchResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
