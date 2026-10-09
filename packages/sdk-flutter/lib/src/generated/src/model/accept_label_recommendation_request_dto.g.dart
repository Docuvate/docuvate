// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_label_recommendation_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptLabelRecommendationRequestDto
    extends AcceptLabelRecommendationRequestDto {
  @override
  final String? recommendationId;
  @override
  final String? proposedName;
  @override
  final String? tagId;
  @override
  final String? keepTagId;
  @override
  final String? removeTagId;
  @override
  final String? color;

  factory _$AcceptLabelRecommendationRequestDto(
          [void Function(AcceptLabelRecommendationRequestDtoBuilder)?
              updates]) =>
      (AcceptLabelRecommendationRequestDtoBuilder()..update(updates))._build();

  _$AcceptLabelRecommendationRequestDto._(
      {this.recommendationId,
      this.proposedName,
      this.tagId,
      this.keepTagId,
      this.removeTagId,
      this.color})
      : super._();
  @override
  AcceptLabelRecommendationRequestDto rebuild(
          void Function(AcceptLabelRecommendationRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptLabelRecommendationRequestDtoBuilder toBuilder() =>
      AcceptLabelRecommendationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptLabelRecommendationRequestDto &&
        recommendationId == other.recommendationId &&
        proposedName == other.proposedName &&
        tagId == other.tagId &&
        keepTagId == other.keepTagId &&
        removeTagId == other.removeTagId &&
        color == other.color;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, recommendationId.hashCode);
    _$hash = $jc(_$hash, proposedName.hashCode);
    _$hash = $jc(_$hash, tagId.hashCode);
    _$hash = $jc(_$hash, keepTagId.hashCode);
    _$hash = $jc(_$hash, removeTagId.hashCode);
    _$hash = $jc(_$hash, color.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AcceptLabelRecommendationRequestDto')
          ..add('recommendationId', recommendationId)
          ..add('proposedName', proposedName)
          ..add('tagId', tagId)
          ..add('keepTagId', keepTagId)
          ..add('removeTagId', removeTagId)
          ..add('color', color))
        .toString();
  }
}

class AcceptLabelRecommendationRequestDtoBuilder
    implements
        Builder<AcceptLabelRecommendationRequestDto,
            AcceptLabelRecommendationRequestDtoBuilder> {
  _$AcceptLabelRecommendationRequestDto? _$v;

  String? _recommendationId;
  String? get recommendationId => _$this._recommendationId;
  set recommendationId(String? recommendationId) =>
      _$this._recommendationId = recommendationId;

  String? _proposedName;
  String? get proposedName => _$this._proposedName;
  set proposedName(String? proposedName) => _$this._proposedName = proposedName;

  String? _tagId;
  String? get tagId => _$this._tagId;
  set tagId(String? tagId) => _$this._tagId = tagId;

  String? _keepTagId;
  String? get keepTagId => _$this._keepTagId;
  set keepTagId(String? keepTagId) => _$this._keepTagId = keepTagId;

  String? _removeTagId;
  String? get removeTagId => _$this._removeTagId;
  set removeTagId(String? removeTagId) => _$this._removeTagId = removeTagId;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  AcceptLabelRecommendationRequestDtoBuilder() {
    AcceptLabelRecommendationRequestDto._defaults(this);
  }

  AcceptLabelRecommendationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _recommendationId = $v.recommendationId;
      _proposedName = $v.proposedName;
      _tagId = $v.tagId;
      _keepTagId = $v.keepTagId;
      _removeTagId = $v.removeTagId;
      _color = $v.color;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptLabelRecommendationRequestDto other) {
    _$v = other as _$AcceptLabelRecommendationRequestDto;
  }

  @override
  void update(
      void Function(AcceptLabelRecommendationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptLabelRecommendationRequestDto build() => _build();

  _$AcceptLabelRecommendationRequestDto _build() {
    final _$result = _$v ??
        _$AcceptLabelRecommendationRequestDto._(
          recommendationId: recommendationId,
          proposedName: proposedName,
          tagId: tagId,
          keepTagId: keepTagId,
          removeTagId: removeTagId,
          color: color,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
