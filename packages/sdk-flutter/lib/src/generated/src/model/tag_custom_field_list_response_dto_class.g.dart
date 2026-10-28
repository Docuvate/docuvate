// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_custom_field_list_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagCustomFieldListResponseDtoClass
    extends TagCustomFieldListResponseDtoClass {
  @override
  final BuiltList<JsonObject> items;
  @override
  final BuiltList<JsonObject>? suggestions;

  factory _$TagCustomFieldListResponseDtoClass(
          [void Function(TagCustomFieldListResponseDtoClassBuilder)?
              updates]) =>
      (new TagCustomFieldListResponseDtoClassBuilder()..update(updates))
          ._build();

  _$TagCustomFieldListResponseDtoClass._(
      {required this.items, this.suggestions})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'TagCustomFieldListResponseDtoClass', 'items');
  }

  @override
  TagCustomFieldListResponseDtoClass rebuild(
          void Function(TagCustomFieldListResponseDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagCustomFieldListResponseDtoClassBuilder toBuilder() =>
      new TagCustomFieldListResponseDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagCustomFieldListResponseDtoClass &&
        items == other.items &&
        suggestions == other.suggestions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, suggestions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TagCustomFieldListResponseDtoClass')
          ..add('items', items)
          ..add('suggestions', suggestions))
        .toString();
  }
}

class TagCustomFieldListResponseDtoClassBuilder
    implements
        Builder<TagCustomFieldListResponseDtoClass,
            TagCustomFieldListResponseDtoClassBuilder> {
  _$TagCustomFieldListResponseDtoClass? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  ListBuilder<JsonObject>? _suggestions;
  ListBuilder<JsonObject> get suggestions =>
      _$this._suggestions ??= new ListBuilder<JsonObject>();
  set suggestions(ListBuilder<JsonObject>? suggestions) =>
      _$this._suggestions = suggestions;

  TagCustomFieldListResponseDtoClassBuilder() {
    TagCustomFieldListResponseDtoClass._defaults(this);
  }

  TagCustomFieldListResponseDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _suggestions = $v.suggestions?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagCustomFieldListResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$TagCustomFieldListResponseDtoClass;
  }

  @override
  void update(
      void Function(TagCustomFieldListResponseDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagCustomFieldListResponseDtoClass build() => _build();

  _$TagCustomFieldListResponseDtoClass _build() {
    _$TagCustomFieldListResponseDtoClass _$result;
    try {
      _$result = _$v ??
          new _$TagCustomFieldListResponseDtoClass._(
              items: items.build(), suggestions: _suggestions?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
        _$failedField = 'suggestions';
        _suggestions?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'TagCustomFieldListResponseDtoClass', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
