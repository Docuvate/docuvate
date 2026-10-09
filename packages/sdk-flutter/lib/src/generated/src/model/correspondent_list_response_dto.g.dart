// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'correspondent_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CorrespondentListResponseDto extends CorrespondentListResponseDto {
  @override
  final BuiltList<JsonObject> items;

  factory _$CorrespondentListResponseDto(
          [void Function(CorrespondentListResponseDtoBuilder)? updates]) =>
      (new CorrespondentListResponseDtoBuilder()..update(updates))._build();

  _$CorrespondentListResponseDto._({required this.items}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'CorrespondentListResponseDto', 'items');
  }

  @override
  CorrespondentListResponseDto rebuild(
          void Function(CorrespondentListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CorrespondentListResponseDtoBuilder toBuilder() =>
      new CorrespondentListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CorrespondentListResponseDto && items == other.items;
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
    return (newBuiltValueToStringHelper(r'CorrespondentListResponseDto')
          ..add('items', items))
        .toString();
  }
}

class CorrespondentListResponseDtoBuilder
    implements
        Builder<CorrespondentListResponseDto,
            CorrespondentListResponseDtoBuilder> {
  _$CorrespondentListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  CorrespondentListResponseDtoBuilder() {
    CorrespondentListResponseDto._defaults(this);
  }

  CorrespondentListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CorrespondentListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CorrespondentListResponseDto;
  }

  @override
  void update(void Function(CorrespondentListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CorrespondentListResponseDto build() => _build();

  _$CorrespondentListResponseDto _build() {
    _$CorrespondentListResponseDto _$result;
    try {
      _$result =
          _$v ?? new _$CorrespondentListResponseDto._(items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'CorrespondentListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
