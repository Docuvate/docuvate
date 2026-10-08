// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagListResponseDto extends TagListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$TagListResponseDto(
          [void Function(TagListResponseDtoBuilder)? updates]) =>
      (new TagListResponseDtoBuilder()..update(updates))._build();

  _$TagListResponseDto._({required this.items}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'TagListResponseDto', 'items');
  }

  @override
  TagListResponseDto rebuild(
          void Function(TagListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagListResponseDtoBuilder toBuilder() =>
      new TagListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'TagListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class TagListResponseDtoBuilder
    implements Builder<TagListResponseDto, TagListResponseDtoBuilder> {
  _$TagListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  TagListResponseDtoBuilder() {
    TagListResponseDto._defaults(this);
  }

  TagListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$TagListResponseDto;
  }

  @override
  void update(void Function(TagListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagListResponseDto build() => _build();

  _$TagListResponseDto _build() {
    _$TagListResponseDto _$result;
    try {
      _$result = _$v ?? new _$TagListResponseDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'TagListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
