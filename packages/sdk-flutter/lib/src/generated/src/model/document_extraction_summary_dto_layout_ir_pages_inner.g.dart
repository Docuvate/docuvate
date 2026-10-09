// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_extraction_summary_dto_layout_ir_pages_inner.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentExtractionSummaryDtoLayoutIrPagesInner
    extends DocumentExtractionSummaryDtoLayoutIrPagesInner {
  @override
  final int? page;
  @override
  final num? widthPt;
  @override
  final num? heightPt;

  factory _$DocumentExtractionSummaryDtoLayoutIrPagesInner(
          [void Function(DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder)?
              updates]) =>
      (DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder()..update(updates))
          ._build();

  _$DocumentExtractionSummaryDtoLayoutIrPagesInner._(
      {this.page, this.widthPt, this.heightPt})
      : super._();
  @override
  DocumentExtractionSummaryDtoLayoutIrPagesInner rebuild(
          void Function(DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder toBuilder() =>
      DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentExtractionSummaryDtoLayoutIrPagesInner &&
        page == other.page &&
        widthPt == other.widthPt &&
        heightPt == other.heightPt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, widthPt.hashCode);
    _$hash = $jc(_$hash, heightPt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentExtractionSummaryDtoLayoutIrPagesInner')
          ..add('page', page)
          ..add('widthPt', widthPt)
          ..add('heightPt', heightPt))
        .toString();
  }
}

class DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder
    implements
        Builder<DocumentExtractionSummaryDtoLayoutIrPagesInner,
            DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder> {
  _$DocumentExtractionSummaryDtoLayoutIrPagesInner? _$v;

  int? _page;
  int? get page => _$this._page;
  set page(int? page) => _$this._page = page;

  num? _widthPt;
  num? get widthPt => _$this._widthPt;
  set widthPt(num? widthPt) => _$this._widthPt = widthPt;

  num? _heightPt;
  num? get heightPt => _$this._heightPt;
  set heightPt(num? heightPt) => _$this._heightPt = heightPt;

  DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder() {
    DocumentExtractionSummaryDtoLayoutIrPagesInner._defaults(this);
  }

  DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _page = $v.page;
      _widthPt = $v.widthPt;
      _heightPt = $v.heightPt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentExtractionSummaryDtoLayoutIrPagesInner other) {
    _$v = other as _$DocumentExtractionSummaryDtoLayoutIrPagesInner;
  }

  @override
  void update(
      void Function(DocumentExtractionSummaryDtoLayoutIrPagesInnerBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentExtractionSummaryDtoLayoutIrPagesInner build() => _build();

  _$DocumentExtractionSummaryDtoLayoutIrPagesInner _build() {
    final _$result = _$v ??
        _$DocumentExtractionSummaryDtoLayoutIrPagesInner._(
          page: page,
          widthPt: widthPt,
          heightPt: heightPt,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
