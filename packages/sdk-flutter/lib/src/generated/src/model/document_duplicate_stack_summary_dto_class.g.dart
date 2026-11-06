// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_duplicate_stack_summary_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentDuplicateStackSummaryDtoClass
    extends DocumentDuplicateStackSummaryDtoClass {
  @override
  final String stackId;
  @override
  final num versionCount;
  @override
  final bool pendingReview;

  factory _$DocumentDuplicateStackSummaryDtoClass(
          [void Function(DocumentDuplicateStackSummaryDtoClassBuilder)?
              updates]) =>
      (DocumentDuplicateStackSummaryDtoClassBuilder()..update(updates))
          ._build();

  _$DocumentDuplicateStackSummaryDtoClass._(
      {required this.stackId,
      required this.versionCount,
      required this.pendingReview})
      : super._();
  @override
  DocumentDuplicateStackSummaryDtoClass rebuild(
          void Function(DocumentDuplicateStackSummaryDtoClassBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentDuplicateStackSummaryDtoClassBuilder toBuilder() =>
      DocumentDuplicateStackSummaryDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentDuplicateStackSummaryDtoClass &&
        stackId == other.stackId &&
        versionCount == other.versionCount &&
        pendingReview == other.pendingReview;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, stackId.hashCode);
    _$hash = $jc(_$hash, versionCount.hashCode);
    _$hash = $jc(_$hash, pendingReview.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentDuplicateStackSummaryDtoClass')
          ..add('stackId', stackId)
          ..add('versionCount', versionCount)
          ..add('pendingReview', pendingReview))
        .toString();
  }
}

class DocumentDuplicateStackSummaryDtoClassBuilder
    implements
        Builder<DocumentDuplicateStackSummaryDtoClass,
            DocumentDuplicateStackSummaryDtoClassBuilder> {
  _$DocumentDuplicateStackSummaryDtoClass? _$v;

  String? _stackId;
  String? get stackId => _$this._stackId;
  set stackId(String? stackId) => _$this._stackId = stackId;

  num? _versionCount;
  num? get versionCount => _$this._versionCount;
  set versionCount(num? versionCount) => _$this._versionCount = versionCount;

  bool? _pendingReview;
  bool? get pendingReview => _$this._pendingReview;
  set pendingReview(bool? pendingReview) =>
      _$this._pendingReview = pendingReview;

  DocumentDuplicateStackSummaryDtoClassBuilder() {
    DocumentDuplicateStackSummaryDtoClass._defaults(this);
  }

  DocumentDuplicateStackSummaryDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _stackId = $v.stackId;
      _versionCount = $v.versionCount;
      _pendingReview = $v.pendingReview;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentDuplicateStackSummaryDtoClass other) {
    _$v = other as _$DocumentDuplicateStackSummaryDtoClass;
  }

  @override
  void update(
      void Function(DocumentDuplicateStackSummaryDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentDuplicateStackSummaryDtoClass build() => _build();

  _$DocumentDuplicateStackSummaryDtoClass _build() {
    final _$result = _$v ??
        _$DocumentDuplicateStackSummaryDtoClass._(
          stackId: BuiltValueNullFieldError.checkNotNull(
              stackId, r'DocumentDuplicateStackSummaryDtoClass', 'stackId'),
          versionCount: BuiltValueNullFieldError.checkNotNull(versionCount,
              r'DocumentDuplicateStackSummaryDtoClass', 'versionCount'),
          pendingReview: BuiltValueNullFieldError.checkNotNull(pendingReview,
              r'DocumentDuplicateStackSummaryDtoClass', 'pendingReview'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
