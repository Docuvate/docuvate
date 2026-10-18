// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_compare_page_metric_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutComparePageMetricDto extends LayoutComparePageMetricDto {
  @override
  final num pageNumber;
  @override
  final num? ssim;
  @override
  final num? inkDeviation;
  @override
  final bool pageReliable;
  @override
  final String? errorCode;

  factory _$LayoutComparePageMetricDto(
          [void Function(LayoutComparePageMetricDtoBuilder)? updates]) =>
      (new LayoutComparePageMetricDtoBuilder()..update(updates))._build();

  _$LayoutComparePageMetricDto._(
      {required this.pageNumber,
      this.ssim,
      this.inkDeviation,
      required this.pageReliable,
      this.errorCode})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        pageNumber, r'LayoutComparePageMetricDto', 'pageNumber');
    BuiltValueNullFieldError.checkNotNull(
        pageReliable, r'LayoutComparePageMetricDto', 'pageReliable');
  }

  @override
  LayoutComparePageMetricDto rebuild(
          void Function(LayoutComparePageMetricDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutComparePageMetricDtoBuilder toBuilder() =>
      new LayoutComparePageMetricDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutComparePageMetricDto &&
        pageNumber == other.pageNumber &&
        ssim == other.ssim &&
        inkDeviation == other.inkDeviation &&
        pageReliable == other.pageReliable &&
        errorCode == other.errorCode;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, pageNumber.hashCode);
    _$hash = $jc(_$hash, ssim.hashCode);
    _$hash = $jc(_$hash, inkDeviation.hashCode);
    _$hash = $jc(_$hash, pageReliable.hashCode);
    _$hash = $jc(_$hash, errorCode.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutComparePageMetricDto')
          ..add('pageNumber', pageNumber)
          ..add('ssim', ssim)
          ..add('inkDeviation', inkDeviation)
          ..add('pageReliable', pageReliable)
          ..add('errorCode', errorCode))
        .toString();
  }
}

class LayoutComparePageMetricDtoBuilder
    implements
        Builder<LayoutComparePageMetricDto, LayoutComparePageMetricDtoBuilder> {
  _$LayoutComparePageMetricDto? _$v;

  num? _pageNumber;
  num? get pageNumber => _$this._pageNumber;
  set pageNumber(num? pageNumber) => _$this._pageNumber = pageNumber;

  num? _ssim;
  num? get ssim => _$this._ssim;
  set ssim(num? ssim) => _$this._ssim = ssim;

  num? _inkDeviation;
  num? get inkDeviation => _$this._inkDeviation;
  set inkDeviation(num? inkDeviation) => _$this._inkDeviation = inkDeviation;

  bool? _pageReliable;
  bool? get pageReliable => _$this._pageReliable;
  set pageReliable(bool? pageReliable) => _$this._pageReliable = pageReliable;

  String? _errorCode;
  String? get errorCode => _$this._errorCode;
  set errorCode(String? errorCode) => _$this._errorCode = errorCode;

  LayoutComparePageMetricDtoBuilder() {
    LayoutComparePageMetricDto._defaults(this);
  }

  LayoutComparePageMetricDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _pageNumber = $v.pageNumber;
      _ssim = $v.ssim;
      _inkDeviation = $v.inkDeviation;
      _pageReliable = $v.pageReliable;
      _errorCode = $v.errorCode;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutComparePageMetricDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutComparePageMetricDto;
  }

  @override
  void update(void Function(LayoutComparePageMetricDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutComparePageMetricDto build() => _build();

  _$LayoutComparePageMetricDto _build() {
    final _$result = _$v ??
        new _$LayoutComparePageMetricDto._(
            pageNumber: BuiltValueNullFieldError.checkNotNull(
                pageNumber, r'LayoutComparePageMetricDto', 'pageNumber'),
            ssim: ssim,
            inkDeviation: inkDeviation,
            pageReliable: BuiltValueNullFieldError.checkNotNull(
                pageReliable, r'LayoutComparePageMetricDto', 'pageReliable'),
            errorCode: errorCode);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
