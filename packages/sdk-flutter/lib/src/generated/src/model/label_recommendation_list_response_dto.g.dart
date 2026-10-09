// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_recommendation_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LabelRecommendationListResponseDto
    extends LabelRecommendationListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$LabelRecommendationListResponseDto(
          [void Function(LabelRecommendationListResponseDtoBuilder)?
              updates]) =>
      (LabelRecommendationListResponseDtoBuilder()..update(updates))._build();

  _$LabelRecommendationListResponseDto._({required this.items}) : super._();
  @override
  LabelRecommendationListResponseDto rebuild(
          void Function(LabelRecommendationListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LabelRecommendationListResponseDtoBuilder toBuilder() =>
      LabelRecommendationListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LabelRecommendationListResponseDto && items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LabelRecommendationListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class LabelRecommendationListResponseDtoBuilder
    implements
        Builder<LabelRecommendationListResponseDto,
            LabelRecommendationListResponseDtoBuilder> {
  _$LabelRecommendationListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  LabelRecommendationListResponseDtoBuilder() {
    LabelRecommendationListResponseDto._defaults(this);
  }

  LabelRecommendationListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LabelRecommendationListResponseDto other) {
    _$v = other as _$LabelRecommendationListResponseDto;
  }

  @override
  void update(
      void Function(LabelRecommendationListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LabelRecommendationListResponseDto build() => _build();

  _$LabelRecommendationListResponseDto _build() {
    _$LabelRecommendationListResponseDto _$result;
    try {
      _$result = _$v ??
          _$LabelRecommendationListResponseDto._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'LabelRecommendationListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
