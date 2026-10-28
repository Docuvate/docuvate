// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'confirm_label_recommendation_blocklist_pattern_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ConfirmLabelRecommendationBlocklistPatternRequestDto
    extends ConfirmLabelRecommendationBlocklistPatternRequestDto {
  @override
  final String pattern;

  factory _$ConfirmLabelRecommendationBlocklistPatternRequestDto(
          [void Function(
                  ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder)?
              updates]) =>
      (new ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder()
            ..update(updates))
          ._build();

  _$ConfirmLabelRecommendationBlocklistPatternRequestDto._(
      {required this.pattern})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(pattern,
        r'ConfirmLabelRecommendationBlocklistPatternRequestDto', 'pattern');
  }

  @override
  ConfirmLabelRecommendationBlocklistPatternRequestDto rebuild(
          void Function(
                  ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder toBuilder() =>
      new ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ConfirmLabelRecommendationBlocklistPatternRequestDto &&
        pattern == other.pattern;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, pattern.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'ConfirmLabelRecommendationBlocklistPatternRequestDto')
          ..add('pattern', pattern))
        .toString();
  }
}

class ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder
    implements
        Builder<ConfirmLabelRecommendationBlocklistPatternRequestDto,
            ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder> {
  _$ConfirmLabelRecommendationBlocklistPatternRequestDto? _$v;

  String? _pattern;
  String? get pattern => _$this._pattern;
  set pattern(String? pattern) => _$this._pattern = pattern;

  ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder() {
    ConfirmLabelRecommendationBlocklistPatternRequestDto._defaults(this);
  }

  ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _pattern = $v.pattern;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ConfirmLabelRecommendationBlocklistPatternRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ConfirmLabelRecommendationBlocklistPatternRequestDto;
  }

  @override
  void update(
      void Function(
              ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  ConfirmLabelRecommendationBlocklistPatternRequestDto build() => _build();

  _$ConfirmLabelRecommendationBlocklistPatternRequestDto _build() {
    final _$result = _$v ??
        new _$ConfirmLabelRecommendationBlocklistPatternRequestDto._(
            pattern: BuiltValueNullFieldError.checkNotNull(
                pattern,
                r'ConfirmLabelRecommendationBlocklistPatternRequestDto',
                'pattern'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
