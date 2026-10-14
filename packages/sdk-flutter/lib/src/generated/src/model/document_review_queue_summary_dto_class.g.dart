// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_review_queue_summary_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentReviewQueueSummaryDtoClass
    extends DocumentReviewQueueSummaryDtoClass {
  @override
  final num pendingCount;

  factory _$DocumentReviewQueueSummaryDtoClass(
          [void Function(DocumentReviewQueueSummaryDtoClassBuilder)?
              updates]) =>
      (DocumentReviewQueueSummaryDtoClassBuilder()..update(updates))._build();

  _$DocumentReviewQueueSummaryDtoClass._({required this.pendingCount})
      : super._();
  @override
  DocumentReviewQueueSummaryDtoClass rebuild(
          void Function(DocumentReviewQueueSummaryDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentReviewQueueSummaryDtoClassBuilder toBuilder() =>
      DocumentReviewQueueSummaryDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentReviewQueueSummaryDtoClass &&
        pendingCount == other.pendingCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, pendingCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentReviewQueueSummaryDtoClass')
          ..add('pendingCount', pendingCount))
        .toString();
  }
}

class DocumentReviewQueueSummaryDtoClassBuilder
    implements
        Builder<DocumentReviewQueueSummaryDtoClass,
            DocumentReviewQueueSummaryDtoClassBuilder> {
  _$DocumentReviewQueueSummaryDtoClass? _$v;

  num? _pendingCount;
  num? get pendingCount => _$this._pendingCount;
  set pendingCount(num? pendingCount) => _$this._pendingCount = pendingCount;

  DocumentReviewQueueSummaryDtoClassBuilder() {
    DocumentReviewQueueSummaryDtoClass._defaults(this);
  }

  DocumentReviewQueueSummaryDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _pendingCount = $v.pendingCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentReviewQueueSummaryDtoClass other) {
    _$v = other as _$DocumentReviewQueueSummaryDtoClass;
  }

  @override
  void update(
      void Function(DocumentReviewQueueSummaryDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentReviewQueueSummaryDtoClass build() => _build();

  _$DocumentReviewQueueSummaryDtoClass _build() {
    final _$result = _$v ??
        _$DocumentReviewQueueSummaryDtoClass._(
          pendingCount: BuiltValueNullFieldError.checkNotNull(pendingCount,
              r'DocumentReviewQueueSummaryDtoClass', 'pendingCount'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
