// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_custom_field_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagCustomFieldListResponseDto extends TagCustomFieldListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$TagCustomFieldListResponseDto(
          [void Function(TagCustomFieldListResponseDtoBuilder)? updates]) =>
      (new TagCustomFieldListResponseDtoBuilder()..update(updates))._build();

  _$TagCustomFieldListResponseDto._({required this.items}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'TagCustomFieldListResponseDto', 'items');
  }

  @override
  TagCustomFieldListResponseDto rebuild(
          void Function(TagCustomFieldListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagCustomFieldListResponseDtoBuilder toBuilder() =>
      new TagCustomFieldListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagCustomFieldListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'TagCustomFieldListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class TagCustomFieldListResponseDtoBuilder
    implements
        Builder<TagCustomFieldListResponseDto,
            TagCustomFieldListResponseDtoBuilder> {
  _$TagCustomFieldListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  TagCustomFieldListResponseDtoBuilder() {
    TagCustomFieldListResponseDto._defaults(this);
  }

  TagCustomFieldListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagCustomFieldListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$TagCustomFieldListResponseDto;
  }

  @override
  void update(void Function(TagCustomFieldListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagCustomFieldListResponseDto build() => _build();

  _$TagCustomFieldListResponseDto _build() {
    _$TagCustomFieldListResponseDto _$result;
    try {
      _$result =
          _$v ?? new _$TagCustomFieldListResponseDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'TagCustomFieldListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
