// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_review_queue_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentReviewQueueResponseDtoClass
    extends DocumentReviewQueueResponseDtoClass {
  @override
  final BuiltList<DocumentReviewQueueItemDtoClass> items;
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;

  factory _$DocumentReviewQueueResponseDtoClass(
          [void Function(DocumentReviewQueueResponseDtoClassBuilder)?
              updates]) =>
      (new DocumentReviewQueueResponseDtoClassBuilder()..update(updates))
          ._build();

  _$DocumentReviewQueueResponseDtoClass._(
      {required this.items,
      required this.nextCursor,
      required this.hasMore,
      required this.total})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'DocumentReviewQueueResponseDtoClass', 'items');
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'DocumentReviewQueueResponseDtoClass', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'DocumentReviewQueueResponseDtoClass', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'DocumentReviewQueueResponseDtoClass', 'total');
  }

  @override
  DocumentReviewQueueResponseDtoClass rebuild(
          void Function(DocumentReviewQueueResponseDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentReviewQueueResponseDtoClassBuilder toBuilder() =>
      new DocumentReviewQueueResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentReviewQueueResponseDtoClass &&
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
    return (newBuiltValueToStringHelper(r'DocumentReviewQueueResponseDtoClass')
          ..add('items', items)
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total))
        .toString();
  }
}

class DocumentReviewQueueResponseDtoClassBuilder
    implements
        Builder<DocumentReviewQueueResponseDtoClass,
            DocumentReviewQueueResponseDtoClassBuilder> {
  _$DocumentReviewQueueResponseDtoClass? _$v;

  ListBuilder<DocumentReviewQueueItemDtoClass>? _items;
  ListBuilder<DocumentReviewQueueItemDtoClass> get items =>
      _$this._items ??= new ListBuilder<DocumentReviewQueueItemDtoClass>();
  set items(ListBuilder<DocumentReviewQueueItemDtoClass>? items) =>
      _$this._items = items;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  DocumentReviewQueueResponseDtoClassBuilder() {
    DocumentReviewQueueResponseDtoClass._defaults(this);
  }

  DocumentReviewQueueResponseDtoClassBuilder get _$this {
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
  void replace(DocumentReviewQueueResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentReviewQueueResponseDtoClass;
  }

  @override
  void update(
      void Function(DocumentReviewQueueResponseDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentReviewQueueResponseDtoClass build() => _build();

  _$DocumentReviewQueueResponseDtoClass _build() {
    _$DocumentReviewQueueResponseDtoClass _$result;
    try {
      _$result = _$v ??
          new _$DocumentReviewQueueResponseDtoClass._(
              items: items.build(),
              nextCursor: BuiltValueNullFieldError.checkNotNull(nextCursor,
                  r'DocumentReviewQueueResponseDtoClass', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(
                  hasMore, r'DocumentReviewQueueResponseDtoClass', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'DocumentReviewQueueResponseDtoClass', 'total'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentReviewQueueResponseDtoClass',
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
