// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mappe_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MappeListResponseDto extends MappeListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$MappeListResponseDto(
          [void Function(MappeListResponseDtoBuilder)? updates]) =>
      (MappeListResponseDtoBuilder()..update(updates))._build();

  _$MappeListResponseDto._({required this.items}) : super._();
  @override
  MappeListResponseDto rebuild(
          void Function(MappeListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MappeListResponseDtoBuilder toBuilder() =>
      MappeListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MappeListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'MappeListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class MappeListResponseDtoBuilder
    implements Builder<MappeListResponseDto, MappeListResponseDtoBuilder> {
  _$MappeListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  MappeListResponseDtoBuilder() {
    MappeListResponseDto._defaults(this);
  }

  MappeListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MappeListResponseDto other) {
    _$v = other as _$MappeListResponseDto;
  }

  @override
  void update(void Function(MappeListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MappeListResponseDto build() => _build();

  _$MappeListResponseDto _build() {
    _$MappeListResponseDto _$result;
    try {
      _$result = _$v ??
          _$MappeListResponseDto._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'MappeListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
