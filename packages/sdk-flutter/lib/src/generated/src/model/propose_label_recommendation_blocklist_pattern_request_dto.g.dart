// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'propose_label_recommendation_blocklist_pattern_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ProposeLabelRecommendationBlocklistPatternRequestDto
    extends ProposeLabelRecommendationBlocklistPatternRequestDto {
  @override
  final BuiltList<String> phrases;

  factory _$ProposeLabelRecommendationBlocklistPatternRequestDto(
          [void Function(
                  ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder)?
              updates]) =>
      (ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder()
            ..update(updates))
          ._build();

  _$ProposeLabelRecommendationBlocklistPatternRequestDto._(
      {required this.phrases})
      : super._();
  @override
  ProposeLabelRecommendationBlocklistPatternRequestDto rebuild(
          void Function(
                  ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder toBuilder() =>
      ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ProposeLabelRecommendationBlocklistPatternRequestDto &&
        phrases == other.phrases;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, phrases.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'ProposeLabelRecommendationBlocklistPatternRequestDto')
          ..add('phrases', phrases))
        .toString();
  }
}

class ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder
    implements
        Builder<ProposeLabelRecommendationBlocklistPatternRequestDto,
            ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder> {
  _$ProposeLabelRecommendationBlocklistPatternRequestDto? _$v;

  ListBuilder<String>? _phrases;
  ListBuilder<String> get phrases => _$this._phrases ??= ListBuilder<String>();
  set phrases(ListBuilder<String>? phrases) => _$this._phrases = phrases;

  ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder() {
    ProposeLabelRecommendationBlocklistPatternRequestDto._defaults(this);
  }

  ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _phrases = $v.phrases.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ProposeLabelRecommendationBlocklistPatternRequestDto other) {
    _$v = other as _$ProposeLabelRecommendationBlocklistPatternRequestDto;
  }

  @override
  void update(
      void Function(
              ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  ProposeLabelRecommendationBlocklistPatternRequestDto build() => _build();

  _$ProposeLabelRecommendationBlocklistPatternRequestDto _build() {
    _$ProposeLabelRecommendationBlocklistPatternRequestDto _$result;
    try {
      _$result = _$v ??
          _$ProposeLabelRecommendationBlocklistPatternRequestDto._(
            phrases: phrases.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'phrases';
        phrases.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ProposeLabelRecommendationBlocklistPatternRequestDto',
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
