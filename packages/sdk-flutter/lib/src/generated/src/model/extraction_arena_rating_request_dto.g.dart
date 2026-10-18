// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'extraction_arena_rating_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExtractionArenaRatingRequestDto
    extends ExtractionArenaRatingRequestDto {
  @override
  final String winnerEngine;
  @override
  final BuiltList<String> comparedEngines;
  @override
  final num? rating;
  @override
  final bool? applyAsDefault;

  factory _$ExtractionArenaRatingRequestDto(
          [void Function(ExtractionArenaRatingRequestDtoBuilder)? updates]) =>
      (new ExtractionArenaRatingRequestDtoBuilder()..update(updates))._build();

  _$ExtractionArenaRatingRequestDto._(
      {required this.winnerEngine,
      required this.comparedEngines,
      this.rating,
      this.applyAsDefault})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        winnerEngine, r'ExtractionArenaRatingRequestDto', 'winnerEngine');
    BuiltValueNullFieldError.checkNotNull(
        comparedEngines, r'ExtractionArenaRatingRequestDto', 'comparedEngines');
  }

  @override
  ExtractionArenaRatingRequestDto rebuild(
          void Function(ExtractionArenaRatingRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExtractionArenaRatingRequestDtoBuilder toBuilder() =>
      new ExtractionArenaRatingRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExtractionArenaRatingRequestDto &&
        winnerEngine == other.winnerEngine &&
        comparedEngines == other.comparedEngines &&
        rating == other.rating &&
        applyAsDefault == other.applyAsDefault;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, winnerEngine.hashCode);
    _$hash = $jc(_$hash, comparedEngines.hashCode);
    _$hash = $jc(_$hash, rating.hashCode);
    _$hash = $jc(_$hash, applyAsDefault.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExtractionArenaRatingRequestDto')
          ..add('winnerEngine', winnerEngine)
          ..add('comparedEngines', comparedEngines)
          ..add('rating', rating)
          ..add('applyAsDefault', applyAsDefault))
        .toString();
  }
}

class ExtractionArenaRatingRequestDtoBuilder
    implements
        Builder<ExtractionArenaRatingRequestDto,
            ExtractionArenaRatingRequestDtoBuilder> {
  _$ExtractionArenaRatingRequestDto? _$v;

  String? _winnerEngine;
  String? get winnerEngine => _$this._winnerEngine;
  set winnerEngine(String? winnerEngine) => _$this._winnerEngine = winnerEngine;

  ListBuilder<String>? _comparedEngines;
  ListBuilder<String> get comparedEngines =>
      _$this._comparedEngines ??= new ListBuilder<String>();
  set comparedEngines(ListBuilder<String>? comparedEngines) =>
      _$this._comparedEngines = comparedEngines;

  num? _rating;
  num? get rating => _$this._rating;
  set rating(num? rating) => _$this._rating = rating;

  bool? _applyAsDefault;
  bool? get applyAsDefault => _$this._applyAsDefault;
  set applyAsDefault(bool? applyAsDefault) =>
      _$this._applyAsDefault = applyAsDefault;

  ExtractionArenaRatingRequestDtoBuilder() {
    ExtractionArenaRatingRequestDto._defaults(this);
  }

  ExtractionArenaRatingRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _winnerEngine = $v.winnerEngine;
      _comparedEngines = $v.comparedEngines.toBuilder();
      _rating = $v.rating;
      _applyAsDefault = $v.applyAsDefault;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExtractionArenaRatingRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ExtractionArenaRatingRequestDto;
  }

  @override
  void update(void Function(ExtractionArenaRatingRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExtractionArenaRatingRequestDto build() => _build();

  _$ExtractionArenaRatingRequestDto _build() {
    _$ExtractionArenaRatingRequestDto _$result;
    try {
      _$result = _$v ??
          new _$ExtractionArenaRatingRequestDto._(
              winnerEngine: BuiltValueNullFieldError.checkNotNull(winnerEngine,
                  r'ExtractionArenaRatingRequestDto', 'winnerEngine'),
              comparedEngines: comparedEngines.build(),
              rating: rating,
              applyAsDefault: applyAsDefault);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'comparedEngines';
        comparedEngines.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ExtractionArenaRatingRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
