// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentListResponseDto extends DocumentListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$DocumentListResponseDto(
          [void Function(DocumentListResponseDtoBuilder)? updates]) =>
      (DocumentListResponseDtoBuilder()..update(updates))._build();

  _$DocumentListResponseDto._({required this.items}) : super._();
  @override
  DocumentListResponseDto rebuild(
          void Function(DocumentListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentListResponseDtoBuilder toBuilder() =>
      DocumentListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'DocumentListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class DocumentListResponseDtoBuilder
    implements
        Builder<DocumentListResponseDto, DocumentListResponseDtoBuilder> {
  _$DocumentListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  DocumentListResponseDtoBuilder() {
    DocumentListResponseDto._defaults(this);
  }

  DocumentListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentListResponseDto other) {
    _$v = other as _$DocumentListResponseDto;
  }

  @override
  void update(void Function(DocumentListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentListResponseDto build() => _build();

  _$DocumentListResponseDto _build() {
    _$DocumentListResponseDto _$result;
    try {
      _$result = _$v ??
          _$DocumentListResponseDto._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
