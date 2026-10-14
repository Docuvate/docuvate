// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_review_queue_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentReviewQueueResponseDtoClass
    extends DocumentReviewQueueResponseDtoClass {
  @override
  final num total;
  @override
  final BuiltList<DocumentReviewQueueItemDtoClass> items;

  factory _$DocumentReviewQueueResponseDtoClass(
          [void Function(DocumentReviewQueueResponseDtoClassBuilder)?
              updates]) =>
      (DocumentReviewQueueResponseDtoClassBuilder()..update(updates))._build();

  _$DocumentReviewQueueResponseDtoClass._(
      {required this.total, required this.items})
      : super._();
  @override
  DocumentReviewQueueResponseDtoClass rebuild(
          void Function(DocumentReviewQueueResponseDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentReviewQueueResponseDtoClassBuilder toBuilder() =>
      DocumentReviewQueueResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentReviewQueueResponseDtoClass &&
        total == other.total &&
        items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentReviewQueueResponseDtoClass')
          ..add('total', total)
          ..add('items', items))
        .toString();
  }
}

class DocumentReviewQueueResponseDtoClassBuilder
    implements
        Builder<DocumentReviewQueueResponseDtoClass,
            DocumentReviewQueueResponseDtoClassBuilder> {
  _$DocumentReviewQueueResponseDtoClass? _$v;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  ListBuilder<DocumentReviewQueueItemDtoClass>? _items;
  ListBuilder<DocumentReviewQueueItemDtoClass> get items =>
      _$this._items ??= ListBuilder<DocumentReviewQueueItemDtoClass>();
  set items(ListBuilder<DocumentReviewQueueItemDtoClass>? items) =>
      _$this._items = items;

  DocumentReviewQueueResponseDtoClassBuilder() {
    DocumentReviewQueueResponseDtoClass._defaults(this);
  }

  DocumentReviewQueueResponseDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _total = $v.total;
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentReviewQueueResponseDtoClass other) {
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
          _$DocumentReviewQueueResponseDtoClass._(
            total: BuiltValueNullFieldError.checkNotNull(
                total, r'DocumentReviewQueueResponseDtoClass', 'total'),
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(r'DocumentReviewQueueResponseDtoClass',
            _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
