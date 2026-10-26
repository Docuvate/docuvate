// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'duplicate_set_list_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DuplicateSetListResponseDtoClass
    extends DuplicateSetListResponseDtoClass {
  @override
  final BuiltList<JsonObject> items;
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;

  factory _$DuplicateSetListResponseDtoClass(
          [void Function(DuplicateSetListResponseDtoClassBuilder)? updates]) =>
      (new DuplicateSetListResponseDtoClassBuilder()..update(updates))._build();

  _$DuplicateSetListResponseDtoClass._(
      {required this.items,
      required this.nextCursor,
      required this.hasMore,
      required this.total})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'DuplicateSetListResponseDtoClass', 'items');
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'DuplicateSetListResponseDtoClass', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'DuplicateSetListResponseDtoClass', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'DuplicateSetListResponseDtoClass', 'total');
  }

  @override
  DuplicateSetListResponseDtoClass rebuild(
          void Function(DuplicateSetListResponseDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DuplicateSetListResponseDtoClassBuilder toBuilder() =>
      new DuplicateSetListResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DuplicateSetListResponseDtoClass &&
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
    return (newBuiltValueToStringHelper(r'DuplicateSetListResponseDtoClass')
          ..add('items', items)
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total))
        .toString();
  }
}

class DuplicateSetListResponseDtoClassBuilder
    implements
        Builder<DuplicateSetListResponseDtoClass,
            DuplicateSetListResponseDtoClassBuilder> {
  _$DuplicateSetListResponseDtoClass? _$v;

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

  DuplicateSetListResponseDtoClassBuilder() {
    DuplicateSetListResponseDtoClass._defaults(this);
  }

  DuplicateSetListResponseDtoClassBuilder get _$this {
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
  void replace(DuplicateSetListResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DuplicateSetListResponseDtoClass;
  }

  @override
  void update(void Function(DuplicateSetListResponseDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DuplicateSetListResponseDtoClass build() => _build();

  _$DuplicateSetListResponseDtoClass _build() {
    _$DuplicateSetListResponseDtoClass _$result;
    try {
      _$result = _$v ??
          new _$DuplicateSetListResponseDtoClass._(
              items: items.build(),
              nextCursor: BuiltValueNullFieldError.checkNotNull(nextCursor,
                  r'DuplicateSetListResponseDtoClass', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'DuplicateSetListResponseDtoClass', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'DuplicateSetListResponseDtoClass', 'total'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DuplicateSetListResponseDtoClass', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
