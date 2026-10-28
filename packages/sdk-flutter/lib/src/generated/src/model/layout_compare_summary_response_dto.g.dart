// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_compare_summary_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutCompareSummaryResponseDto
    extends LayoutCompareSummaryResponseDto {
  @override
  final String category;
  @override
  final num ssimFloor;
  @override
  final num pageCount;

  factory _$LayoutCompareSummaryResponseDto(
          [void Function(LayoutCompareSummaryResponseDtoBuilder)? updates]) =>
      (new LayoutCompareSummaryResponseDtoBuilder()..update(updates))._build();

  _$LayoutCompareSummaryResponseDto._(
      {required this.category,
      required this.ssimFloor,
      required this.pageCount})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        category, r'LayoutCompareSummaryResponseDto', 'category');
    BuiltValueNullFieldError.checkNotNull(
        ssimFloor, r'LayoutCompareSummaryResponseDto', 'ssimFloor');
    BuiltValueNullFieldError.checkNotNull(
        pageCount, r'LayoutCompareSummaryResponseDto', 'pageCount');
  }

  @override
  LayoutCompareSummaryResponseDto rebuild(
          void Function(LayoutCompareSummaryResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutCompareSummaryResponseDtoBuilder toBuilder() =>
      new LayoutCompareSummaryResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutCompareSummaryResponseDto &&
        category == other.category &&
        ssimFloor == other.ssimFloor &&
        pageCount == other.pageCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jc(_$hash, ssimFloor.hashCode);
    _$hash = $jc(_$hash, pageCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutCompareSummaryResponseDto')
          ..add('category', category)
          ..add('ssimFloor', ssimFloor)
          ..add('pageCount', pageCount))
        .toString();
  }
}

class LayoutCompareSummaryResponseDtoBuilder
    implements
        Builder<LayoutCompareSummaryResponseDto,
            LayoutCompareSummaryResponseDtoBuilder> {
  _$LayoutCompareSummaryResponseDto? _$v;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

  num? _ssimFloor;
  num? get ssimFloor => _$this._ssimFloor;
  set ssimFloor(num? ssimFloor) => _$this._ssimFloor = ssimFloor;

  num? _pageCount;
  num? get pageCount => _$this._pageCount;
  set pageCount(num? pageCount) => _$this._pageCount = pageCount;

  LayoutCompareSummaryResponseDtoBuilder() {
    LayoutCompareSummaryResponseDto._defaults(this);
  }

  LayoutCompareSummaryResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _category = $v.category;
      _ssimFloor = $v.ssimFloor;
      _pageCount = $v.pageCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutCompareSummaryResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutCompareSummaryResponseDto;
  }

  @override
  void update(void Function(LayoutCompareSummaryResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutCompareSummaryResponseDto build() => _build();

  _$LayoutCompareSummaryResponseDto _build() {
    final _$result = _$v ??
        new _$LayoutCompareSummaryResponseDto._(
            category: BuiltValueNullFieldError.checkNotNull(
                category, r'LayoutCompareSummaryResponseDto', 'category'),
            ssimFloor: BuiltValueNullFieldError.checkNotNull(
                ssimFloor, r'LayoutCompareSummaryResponseDto', 'ssimFloor'),
            pageCount: BuiltValueNullFieldError.checkNotNull(
                pageCount, r'LayoutCompareSummaryResponseDto', 'pageCount'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
