// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'saved_document_view_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SavedDocumentViewListResponseDto
    extends SavedDocumentViewListResponseDto {
  @override
  final BuiltList<SavedDocumentViewDtoClass> items;

  factory _$SavedDocumentViewListResponseDto(
          [void Function(SavedDocumentViewListResponseDtoBuilder)? updates]) =>
      (SavedDocumentViewListResponseDtoBuilder()..update(updates))._build();

  _$SavedDocumentViewListResponseDto._({required this.items}) : super._();
  @override
  SavedDocumentViewListResponseDto rebuild(
          void Function(SavedDocumentViewListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SavedDocumentViewListResponseDtoBuilder toBuilder() =>
      SavedDocumentViewListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SavedDocumentViewListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'SavedDocumentViewListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class SavedDocumentViewListResponseDtoBuilder
    implements
        Builder<SavedDocumentViewListResponseDto,
            SavedDocumentViewListResponseDtoBuilder> {
  _$SavedDocumentViewListResponseDto? _$v;

  ListBuilder<SavedDocumentViewDtoClass>? _items;
  ListBuilder<SavedDocumentViewDtoClass> get items =>
      _$this._items ??= ListBuilder<SavedDocumentViewDtoClass>();
  set items(ListBuilder<SavedDocumentViewDtoClass>? items) =>
      _$this._items = items;

  SavedDocumentViewListResponseDtoBuilder() {
    SavedDocumentViewListResponseDto._defaults(this);
  }

  SavedDocumentViewListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SavedDocumentViewListResponseDto other) {
    _$v = other as _$SavedDocumentViewListResponseDto;
  }

  @override
  void update(void Function(SavedDocumentViewListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SavedDocumentViewListResponseDto build() => _build();

  _$SavedDocumentViewListResponseDto _build() {
    _$SavedDocumentViewListResponseDto _$result;
    try {
      _$result = _$v ??
          _$SavedDocumentViewListResponseDto._(
            items: items.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SavedDocumentViewListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
