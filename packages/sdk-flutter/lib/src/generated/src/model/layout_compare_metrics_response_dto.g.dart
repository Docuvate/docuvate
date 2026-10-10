// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_compare_metrics_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutCompareMetricsResponseDto
    extends LayoutCompareMetricsResponseDto {
  @override
  final String category;
  @override
  final num ssimFloor;
  @override
  final BuiltList<LayoutComparePageMetricDto> pages;

  factory _$LayoutCompareMetricsResponseDto(
          [void Function(LayoutCompareMetricsResponseDtoBuilder)? updates]) =>
      (new LayoutCompareMetricsResponseDtoBuilder()..update(updates))._build();

  _$LayoutCompareMetricsResponseDto._(
      {required this.category, required this.ssimFloor, required this.pages})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        category, r'LayoutCompareMetricsResponseDto', 'category');
    BuiltValueNullFieldError.checkNotNull(
        ssimFloor, r'LayoutCompareMetricsResponseDto', 'ssimFloor');
    BuiltValueNullFieldError.checkNotNull(
        pages, r'LayoutCompareMetricsResponseDto', 'pages');
  }

  @override
  LayoutCompareMetricsResponseDto rebuild(
          void Function(LayoutCompareMetricsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutCompareMetricsResponseDtoBuilder toBuilder() =>
      new LayoutCompareMetricsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutCompareMetricsResponseDto &&
        category == other.category &&
        ssimFloor == other.ssimFloor &&
        pages == other.pages;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, category.hashCode);
    _$hash = $jc(_$hash, ssimFloor.hashCode);
    _$hash = $jc(_$hash, pages.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutCompareMetricsResponseDto')
          ..add('category', category)
          ..add('ssimFloor', ssimFloor)
          ..add('pages', pages))
        .toString();
  }
}

class LayoutCompareMetricsResponseDtoBuilder
    implements
        Builder<LayoutCompareMetricsResponseDto,
            LayoutCompareMetricsResponseDtoBuilder> {
  _$LayoutCompareMetricsResponseDto? _$v;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

  num? _ssimFloor;
  num? get ssimFloor => _$this._ssimFloor;
  set ssimFloor(num? ssimFloor) => _$this._ssimFloor = ssimFloor;

  ListBuilder<LayoutComparePageMetricDto>? _pages;
  ListBuilder<LayoutComparePageMetricDto> get pages =>
      _$this._pages ??= new ListBuilder<LayoutComparePageMetricDto>();
  set pages(ListBuilder<LayoutComparePageMetricDto>? pages) =>
      _$this._pages = pages;

  LayoutCompareMetricsResponseDtoBuilder() {
    LayoutCompareMetricsResponseDto._defaults(this);
  }

  LayoutCompareMetricsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _category = $v.category;
      _ssimFloor = $v.ssimFloor;
      _pages = $v.pages.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutCompareMetricsResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutCompareMetricsResponseDto;
  }

  @override
  void update(void Function(LayoutCompareMetricsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutCompareMetricsResponseDto build() => _build();

  _$LayoutCompareMetricsResponseDto _build() {
    _$LayoutCompareMetricsResponseDto _$result;
    try {
      _$result = _$v ??
          new _$LayoutCompareMetricsResponseDto._(
              category: BuiltValueNullFieldError.checkNotNull(
                  category, r'LayoutCompareMetricsResponseDto', 'category'),
              ssimFloor: BuiltValueNullFieldError.checkNotNull(
                  ssimFloor, r'LayoutCompareMetricsResponseDto', 'ssimFloor'),
              pages: pages.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'pages';
        pages.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'LayoutCompareMetricsResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
