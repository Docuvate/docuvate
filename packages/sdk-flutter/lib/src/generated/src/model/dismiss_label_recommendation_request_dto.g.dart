// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dismiss_label_recommendation_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DismissLabelRecommendationRequestDto
    extends DismissLabelRecommendationRequestDto {
  @override
  final String? phrase;
  @override
  final BuiltList<String>? phrases;
  @override
  final bool? blockFuture;

  factory _$DismissLabelRecommendationRequestDto(
          [void Function(DismissLabelRecommendationRequestDtoBuilder)?
              updates]) =>
      (new DismissLabelRecommendationRequestDtoBuilder()..update(updates))
          ._build();

  _$DismissLabelRecommendationRequestDto._(
      {this.phrase, this.phrases, this.blockFuture})
      : super._();

  @override
  DismissLabelRecommendationRequestDto rebuild(
          void Function(DismissLabelRecommendationRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DismissLabelRecommendationRequestDtoBuilder toBuilder() =>
      new DismissLabelRecommendationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DismissLabelRecommendationRequestDto &&
        phrase == other.phrase &&
        phrases == other.phrases &&
        blockFuture == other.blockFuture;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, phrase.hashCode);
    _$hash = $jc(_$hash, phrases.hashCode);
    _$hash = $jc(_$hash, blockFuture.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DismissLabelRecommendationRequestDto')
          ..add('phrase', phrase)
          ..add('phrases', phrases)
          ..add('blockFuture', blockFuture))
        .toString();
  }
}

class DismissLabelRecommendationRequestDtoBuilder
    implements
        Builder<DismissLabelRecommendationRequestDto,
            DismissLabelRecommendationRequestDtoBuilder> {
  _$DismissLabelRecommendationRequestDto? _$v;

  String? _phrase;
  String? get phrase => _$this._phrase;
  set phrase(String? phrase) => _$this._phrase = phrase;

  ListBuilder<String>? _phrases;
  ListBuilder<String> get phrases =>
      _$this._phrases ??= new ListBuilder<String>();
  set phrases(ListBuilder<String>? phrases) => _$this._phrases = phrases;

  bool? _blockFuture;
  bool? get blockFuture => _$this._blockFuture;
  set blockFuture(bool? blockFuture) => _$this._blockFuture = blockFuture;

  DismissLabelRecommendationRequestDtoBuilder() {
    DismissLabelRecommendationRequestDto._defaults(this);
  }

  DismissLabelRecommendationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _phrase = $v.phrase;
      _phrases = $v.phrases?.toBuilder();
      _blockFuture = $v.blockFuture;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DismissLabelRecommendationRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DismissLabelRecommendationRequestDto;
  }

  @override
  void update(
      void Function(DismissLabelRecommendationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DismissLabelRecommendationRequestDto build() => _build();

  _$DismissLabelRecommendationRequestDto _build() {
    _$DismissLabelRecommendationRequestDto _$result;
    try {
      _$result = _$v ??
          new _$DismissLabelRecommendationRequestDto._(
              phrase: phrase,
              phrases: _phrases?.build(),
              blockFuture: blockFuture);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'phrases';
        _phrases?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DismissLabelRecommendationRequestDto',
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
