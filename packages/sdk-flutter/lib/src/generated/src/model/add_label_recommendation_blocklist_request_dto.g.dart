// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'add_label_recommendation_blocklist_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AddLabelRecommendationBlocklistRequestDto
    extends AddLabelRecommendationBlocklistRequestDto {
  @override
  final String phrase;

  factory _$AddLabelRecommendationBlocklistRequestDto(
          [void Function(AddLabelRecommendationBlocklistRequestDtoBuilder)?
              updates]) =>
      (AddLabelRecommendationBlocklistRequestDtoBuilder()..update(updates))
          ._build();

  _$AddLabelRecommendationBlocklistRequestDto._({required this.phrase})
      : super._();
  @override
  AddLabelRecommendationBlocklistRequestDto rebuild(
          void Function(AddLabelRecommendationBlocklistRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AddLabelRecommendationBlocklistRequestDtoBuilder toBuilder() =>
      AddLabelRecommendationBlocklistRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AddLabelRecommendationBlocklistRequestDto &&
        phrase == other.phrase;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, phrase.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'AddLabelRecommendationBlocklistRequestDto')
          ..add('phrase', phrase))
        .toString();
  }
}

class AddLabelRecommendationBlocklistRequestDtoBuilder
    implements
        Builder<AddLabelRecommendationBlocklistRequestDto,
            AddLabelRecommendationBlocklistRequestDtoBuilder> {
  _$AddLabelRecommendationBlocklistRequestDto? _$v;

  String? _phrase;
  String? get phrase => _$this._phrase;
  set phrase(String? phrase) => _$this._phrase = phrase;

  AddLabelRecommendationBlocklistRequestDtoBuilder() {
    AddLabelRecommendationBlocklistRequestDto._defaults(this);
  }

  AddLabelRecommendationBlocklistRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _phrase = $v.phrase;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AddLabelRecommendationBlocklistRequestDto other) {
    _$v = other as _$AddLabelRecommendationBlocklistRequestDto;
  }

  @override
  void update(
      void Function(AddLabelRecommendationBlocklistRequestDtoBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  AddLabelRecommendationBlocklistRequestDto build() => _build();

  _$AddLabelRecommendationBlocklistRequestDto _build() {
    final _$result = _$v ??
        _$AddLabelRecommendationBlocklistRequestDto._(
          phrase: BuiltValueNullFieldError.checkNotNull(
              phrase, r'AddLabelRecommendationBlocklistRequestDto', 'phrase'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
