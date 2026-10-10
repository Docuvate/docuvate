// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_compare_page_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutComparePageResponseDto extends LayoutComparePageResponseDto {
  @override
  final num pageNumber;
  @override
  final num ssim;
  @override
  final num inkDeviation;
  @override
  final num ssimFloor;
  @override
  final bool pageReliable;
  @override
  final num widthPx;
  @override
  final num heightPx;
  @override
  final String originalPngBase64;
  @override
  final String reconstructionPngBase64;
  @override
  final String? heatmapPngBase64;
  @override
  final String? error;

  factory _$LayoutComparePageResponseDto(
          [void Function(LayoutComparePageResponseDtoBuilder)? updates]) =>
      (new LayoutComparePageResponseDtoBuilder()..update(updates))._build();

  _$LayoutComparePageResponseDto._(
      {required this.pageNumber,
      required this.ssim,
      required this.inkDeviation,
      required this.ssimFloor,
      required this.pageReliable,
      required this.widthPx,
      required this.heightPx,
      required this.originalPngBase64,
      required this.reconstructionPngBase64,
      this.heatmapPngBase64,
      this.error})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        pageNumber, r'LayoutComparePageResponseDto', 'pageNumber');
    BuiltValueNullFieldError.checkNotNull(
        ssim, r'LayoutComparePageResponseDto', 'ssim');
    BuiltValueNullFieldError.checkNotNull(
        inkDeviation, r'LayoutComparePageResponseDto', 'inkDeviation');
    BuiltValueNullFieldError.checkNotNull(
        ssimFloor, r'LayoutComparePageResponseDto', 'ssimFloor');
    BuiltValueNullFieldError.checkNotNull(
        pageReliable, r'LayoutComparePageResponseDto', 'pageReliable');
    BuiltValueNullFieldError.checkNotNull(
        widthPx, r'LayoutComparePageResponseDto', 'widthPx');
    BuiltValueNullFieldError.checkNotNull(
        heightPx, r'LayoutComparePageResponseDto', 'heightPx');
    BuiltValueNullFieldError.checkNotNull(originalPngBase64,
        r'LayoutComparePageResponseDto', 'originalPngBase64');
    BuiltValueNullFieldError.checkNotNull(reconstructionPngBase64,
        r'LayoutComparePageResponseDto', 'reconstructionPngBase64');
  }

  @override
  LayoutComparePageResponseDto rebuild(
          void Function(LayoutComparePageResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutComparePageResponseDtoBuilder toBuilder() =>
      new LayoutComparePageResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutComparePageResponseDto &&
        pageNumber == other.pageNumber &&
        ssim == other.ssim &&
        inkDeviation == other.inkDeviation &&
        ssimFloor == other.ssimFloor &&
        pageReliable == other.pageReliable &&
        widthPx == other.widthPx &&
        heightPx == other.heightPx &&
        originalPngBase64 == other.originalPngBase64 &&
        reconstructionPngBase64 == other.reconstructionPngBase64 &&
        heatmapPngBase64 == other.heatmapPngBase64 &&
        error == other.error;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, pageNumber.hashCode);
    _$hash = $jc(_$hash, ssim.hashCode);
    _$hash = $jc(_$hash, inkDeviation.hashCode);
    _$hash = $jc(_$hash, ssimFloor.hashCode);
    _$hash = $jc(_$hash, pageReliable.hashCode);
    _$hash = $jc(_$hash, widthPx.hashCode);
    _$hash = $jc(_$hash, heightPx.hashCode);
    _$hash = $jc(_$hash, originalPngBase64.hashCode);
    _$hash = $jc(_$hash, reconstructionPngBase64.hashCode);
    _$hash = $jc(_$hash, heatmapPngBase64.hashCode);
    _$hash = $jc(_$hash, error.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutComparePageResponseDto')
          ..add('pageNumber', pageNumber)
          ..add('ssim', ssim)
          ..add('inkDeviation', inkDeviation)
          ..add('ssimFloor', ssimFloor)
          ..add('pageReliable', pageReliable)
          ..add('widthPx', widthPx)
          ..add('heightPx', heightPx)
          ..add('originalPngBase64', originalPngBase64)
          ..add('reconstructionPngBase64', reconstructionPngBase64)
          ..add('heatmapPngBase64', heatmapPngBase64)
          ..add('error', error))
        .toString();
  }
}

class LayoutComparePageResponseDtoBuilder
    implements
        Builder<LayoutComparePageResponseDto,
            LayoutComparePageResponseDtoBuilder> {
  _$LayoutComparePageResponseDto? _$v;

  num? _pageNumber;
  num? get pageNumber => _$this._pageNumber;
  set pageNumber(num? pageNumber) => _$this._pageNumber = pageNumber;

  num? _ssim;
  num? get ssim => _$this._ssim;
  set ssim(num? ssim) => _$this._ssim = ssim;

  num? _inkDeviation;
  num? get inkDeviation => _$this._inkDeviation;
  set inkDeviation(num? inkDeviation) => _$this._inkDeviation = inkDeviation;

  num? _ssimFloor;
  num? get ssimFloor => _$this._ssimFloor;
  set ssimFloor(num? ssimFloor) => _$this._ssimFloor = ssimFloor;

  bool? _pageReliable;
  bool? get pageReliable => _$this._pageReliable;
  set pageReliable(bool? pageReliable) => _$this._pageReliable = pageReliable;

  num? _widthPx;
  num? get widthPx => _$this._widthPx;
  set widthPx(num? widthPx) => _$this._widthPx = widthPx;

  num? _heightPx;
  num? get heightPx => _$this._heightPx;
  set heightPx(num? heightPx) => _$this._heightPx = heightPx;

  String? _originalPngBase64;
  String? get originalPngBase64 => _$this._originalPngBase64;
  set originalPngBase64(String? originalPngBase64) =>
      _$this._originalPngBase64 = originalPngBase64;

  String? _reconstructionPngBase64;
  String? get reconstructionPngBase64 => _$this._reconstructionPngBase64;
  set reconstructionPngBase64(String? reconstructionPngBase64) =>
      _$this._reconstructionPngBase64 = reconstructionPngBase64;

  String? _heatmapPngBase64;
  String? get heatmapPngBase64 => _$this._heatmapPngBase64;
  set heatmapPngBase64(String? heatmapPngBase64) =>
      _$this._heatmapPngBase64 = heatmapPngBase64;

  String? _error;
  String? get error => _$this._error;
  set error(String? error) => _$this._error = error;

  LayoutComparePageResponseDtoBuilder() {
    LayoutComparePageResponseDto._defaults(this);
  }

  LayoutComparePageResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _pageNumber = $v.pageNumber;
      _ssim = $v.ssim;
      _inkDeviation = $v.inkDeviation;
      _ssimFloor = $v.ssimFloor;
      _pageReliable = $v.pageReliable;
      _widthPx = $v.widthPx;
      _heightPx = $v.heightPx;
      _originalPngBase64 = $v.originalPngBase64;
      _reconstructionPngBase64 = $v.reconstructionPngBase64;
      _heatmapPngBase64 = $v.heatmapPngBase64;
      _error = $v.error;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutComparePageResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutComparePageResponseDto;
  }

  @override
  void update(void Function(LayoutComparePageResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutComparePageResponseDto build() => _build();

  _$LayoutComparePageResponseDto _build() {
    final _$result = _$v ??
        new _$LayoutComparePageResponseDto._(
            pageNumber: BuiltValueNullFieldError.checkNotNull(
                pageNumber, r'LayoutComparePageResponseDto', 'pageNumber'),
            ssim: BuiltValueNullFieldError.checkNotNull(
                ssim, r'LayoutComparePageResponseDto', 'ssim'),
            inkDeviation: BuiltValueNullFieldError.checkNotNull(
                inkDeviation, r'LayoutComparePageResponseDto', 'inkDeviation'),
            ssimFloor: BuiltValueNullFieldError.checkNotNull(
                ssimFloor, r'LayoutComparePageResponseDto', 'ssimFloor'),
            pageReliable: BuiltValueNullFieldError.checkNotNull(
                pageReliable, r'LayoutComparePageResponseDto', 'pageReliable'),
            widthPx: BuiltValueNullFieldError.checkNotNull(
                widthPx, r'LayoutComparePageResponseDto', 'widthPx'),
            heightPx: BuiltValueNullFieldError.checkNotNull(
                heightPx, r'LayoutComparePageResponseDto', 'heightPx'),
            originalPngBase64:
                BuiltValueNullFieldError.checkNotNull(originalPngBase64, r'LayoutComparePageResponseDto', 'originalPngBase64'),
            reconstructionPngBase64: BuiltValueNullFieldError.checkNotNull(reconstructionPngBase64, r'LayoutComparePageResponseDto', 'reconstructionPngBase64'),
            heatmapPngBase64: heatmapPngBase64,
            error: error);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
