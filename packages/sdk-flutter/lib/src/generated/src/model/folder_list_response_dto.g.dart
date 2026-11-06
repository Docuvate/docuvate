// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'folder_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$FolderListResponseDto extends FolderListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$FolderListResponseDto(
          [void Function(FolderListResponseDtoBuilder)? updates]) =>
      (FolderListResponseDtoBuilder()..update(updates))._build();

  _$FolderListResponseDto._({required this.items}) : super._();
  @override
  FolderListResponseDto rebuild(
          void Function(FolderListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  FolderListResponseDtoBuilder toBuilder() =>
      FolderListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is FolderListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'FolderListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class FolderListResponseDtoBuilder
    implements Builder<FolderListResponseDto, FolderListResponseDtoBuilder> {
  _$FolderListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  FolderListResponseDtoBuilder() {
    FolderListResponseDto._defaults(this);
  }

  FolderListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(FolderListResponseDto other) {
    _$v = other as _$FolderListResponseDto;
  }

  @override
  void update(void Function(FolderListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  FolderListResponseDto build() => _build();

  _$FolderListResponseDto _build() {
    _$FolderListResponseDto _$result;
    try {
      _$result = _$v ??
          _$FolderListResponseDto._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'FolderListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
