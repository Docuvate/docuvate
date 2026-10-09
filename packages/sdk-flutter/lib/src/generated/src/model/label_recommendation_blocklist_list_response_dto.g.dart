// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_recommendation_blocklist_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LabelRecommendationBlocklistListResponseDto
    extends LabelRecommendationBlocklistListResponseDto {
  @override
  final BuiltList<JsonObject> items;
  @override
  final BuiltList<JsonObject> patterns;

  factory _$LabelRecommendationBlocklistListResponseDto(
          [void Function(LabelRecommendationBlocklistListResponseDtoBuilder)?
              updates]) =>
      (new LabelRecommendationBlocklistListResponseDtoBuilder()
            ..update(updates))
          ._build();

  _$LabelRecommendationBlocklistListResponseDto._(
      {required this.items, required this.patterns})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'LabelRecommendationBlocklistListResponseDto', 'items');
    BuiltValueNullFieldError.checkNotNull(
        patterns, r'LabelRecommendationBlocklistListResponseDto', 'patterns');
  }

  @override
  LabelRecommendationBlocklistListResponseDto rebuild(
          void Function(LabelRecommendationBlocklistListResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LabelRecommendationBlocklistListResponseDtoBuilder toBuilder() =>
      new LabelRecommendationBlocklistListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LabelRecommendationBlocklistListResponseDto &&
        items == other.items &&
        patterns == other.patterns;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, patterns.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'LabelRecommendationBlocklistListResponseDto')
          ..add('items', items)
          ..add('patterns', patterns))
        .toString();
  }
}

class LabelRecommendationBlocklistListResponseDtoBuilder
    implements
        Builder<LabelRecommendationBlocklistListResponseDto,
            LabelRecommendationBlocklistListResponseDtoBuilder> {
  _$LabelRecommendationBlocklistListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  ListBuilder<JsonObject>? _patterns;
  ListBuilder<JsonObject> get patterns =>
      _$this._patterns ??= new ListBuilder<JsonObject>();
  set patterns(ListBuilder<JsonObject>? patterns) =>
      _$this._patterns = patterns;

  LabelRecommendationBlocklistListResponseDtoBuilder() {
    LabelRecommendationBlocklistListResponseDto._defaults(this);
  }

  LabelRecommendationBlocklistListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _patterns = $v.patterns.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LabelRecommendationBlocklistListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LabelRecommendationBlocklistListResponseDto;
  }

  @override
  void update(
      void Function(LabelRecommendationBlocklistListResponseDtoBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  LabelRecommendationBlocklistListResponseDto build() => _build();

  _$LabelRecommendationBlocklistListResponseDto _build() {
    _$LabelRecommendationBlocklistListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$LabelRecommendationBlocklistListResponseDto._(
              items: items.build(), patterns: patterns.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
        _$failedField = 'patterns';
        patterns.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'LabelRecommendationBlocklistListResponseDto',
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
