// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_label_recommendation_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptLabelRecommendationResponseDto
    extends AcceptLabelRecommendationResponseDto {
  @override
  final String tagId;
  @override
  final String action;

  factory _$AcceptLabelRecommendationResponseDto(
          [void Function(AcceptLabelRecommendationResponseDtoBuilder)?
              updates]) =>
      (AcceptLabelRecommendationResponseDtoBuilder()..update(updates))._build();

  _$AcceptLabelRecommendationResponseDto._(
      {required this.tagId, required this.action})
      : super._();
  @override
  AcceptLabelRecommendationResponseDto rebuild(
          void Function(AcceptLabelRecommendationResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptLabelRecommendationResponseDtoBuilder toBuilder() =>
      AcceptLabelRecommendationResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptLabelRecommendationResponseDto &&
        tagId == other.tagId &&
        action == other.action;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tagId.hashCode);
    _$hash = $jc(_$hash, action.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AcceptLabelRecommendationResponseDto')
          ..add('tagId', tagId)
          ..add('action', action))
        .toString();
  }
}

class AcceptLabelRecommendationResponseDtoBuilder
    implements
        Builder<AcceptLabelRecommendationResponseDto,
            AcceptLabelRecommendationResponseDtoBuilder> {
  _$AcceptLabelRecommendationResponseDto? _$v;

  String? _tagId;
  String? get tagId => _$this._tagId;
  set tagId(String? tagId) => _$this._tagId = tagId;

  String? _action;
  String? get action => _$this._action;
  set action(String? action) => _$this._action = action;

  AcceptLabelRecommendationResponseDtoBuilder() {
    AcceptLabelRecommendationResponseDto._defaults(this);
  }

  AcceptLabelRecommendationResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tagId = $v.tagId;
      _action = $v.action;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptLabelRecommendationResponseDto other) {
    _$v = other as _$AcceptLabelRecommendationResponseDto;
  }

  @override
  void update(
      void Function(AcceptLabelRecommendationResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptLabelRecommendationResponseDto build() => _build();

  _$AcceptLabelRecommendationResponseDto _build() {
    final _$result = _$v ??
        _$AcceptLabelRecommendationResponseDto._(
          tagId: BuiltValueNullFieldError.checkNotNull(
              tagId, r'AcceptLabelRecommendationResponseDto', 'tagId'),
          action: BuiltValueNullFieldError.checkNotNull(
              action, r'AcceptLabelRecommendationResponseDto', 'action'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
