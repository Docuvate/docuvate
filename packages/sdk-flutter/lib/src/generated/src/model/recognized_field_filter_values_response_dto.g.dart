// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recognized_field_filter_values_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecognizedFieldFilterValuesResponseDto
    extends RecognizedFieldFilterValuesResponseDto {
  @override
  final BuiltList<String> items;
  @override
  final String nextCursor;
  @override
  final bool hasMore;
  @override
  final num total;

  factory _$RecognizedFieldFilterValuesResponseDto(
          [void Function(RecognizedFieldFilterValuesResponseDtoBuilder)?
              updates]) =>
      (new RecognizedFieldFilterValuesResponseDtoBuilder()..update(updates))
          ._build();

  _$RecognizedFieldFilterValuesResponseDto._(
      {required this.items,
      required this.nextCursor,
      required this.hasMore,
      required this.total})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'RecognizedFieldFilterValuesResponseDto', 'items');
    BuiltValueNullFieldError.checkNotNull(
        nextCursor, r'RecognizedFieldFilterValuesResponseDto', 'nextCursor');
    BuiltValueNullFieldError.checkNotNull(
        hasMore, r'RecognizedFieldFilterValuesResponseDto', 'hasMore');
    BuiltValueNullFieldError.checkNotNull(
        total, r'RecognizedFieldFilterValuesResponseDto', 'total');
  }

  @override
  RecognizedFieldFilterValuesResponseDto rebuild(
          void Function(RecognizedFieldFilterValuesResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RecognizedFieldFilterValuesResponseDtoBuilder toBuilder() =>
      new RecognizedFieldFilterValuesResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecognizedFieldFilterValuesResponseDto &&
        items == other.items &&
        nextCursor == other.nextCursor &&
        hasMore == other.hasMore &&
        total == other.total;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, nextCursor.hashCode);
    _$hash = $jc(_$hash, hasMore.hashCode);
    _$hash = $jc(_$hash, total.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'RecognizedFieldFilterValuesResponseDto')
          ..add('items', items)
          ..add('nextCursor', nextCursor)
          ..add('hasMore', hasMore)
          ..add('total', total))
        .toString();
  }
}

class RecognizedFieldFilterValuesResponseDtoBuilder
    implements
        Builder<RecognizedFieldFilterValuesResponseDto,
            RecognizedFieldFilterValuesResponseDtoBuilder> {
  _$RecognizedFieldFilterValuesResponseDto? _$v;

  ListBuilder<String>? _items;
  ListBuilder<String> get items => _$this._items ??= new ListBuilder<String>();
  set items(ListBuilder<String>? items) => _$this._items = items;

  String? _nextCursor;
  String? get nextCursor => _$this._nextCursor;
  set nextCursor(String? nextCursor) => _$this._nextCursor = nextCursor;

  bool? _hasMore;
  bool? get hasMore => _$this._hasMore;
  set hasMore(bool? hasMore) => _$this._hasMore = hasMore;

  num? _total;
  num? get total => _$this._total;
  set total(num? total) => _$this._total = total;

  RecognizedFieldFilterValuesResponseDtoBuilder() {
    RecognizedFieldFilterValuesResponseDto._defaults(this);
  }

  RecognizedFieldFilterValuesResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _nextCursor = $v.nextCursor;
      _hasMore = $v.hasMore;
      _total = $v.total;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecognizedFieldFilterValuesResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$RecognizedFieldFilterValuesResponseDto;
  }

  @override
  void update(
      void Function(RecognizedFieldFilterValuesResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecognizedFieldFilterValuesResponseDto build() => _build();

  _$RecognizedFieldFilterValuesResponseDto _build() {
    _$RecognizedFieldFilterValuesResponseDto _$result;
    try {
      _$result = _$v ??
          new _$RecognizedFieldFilterValuesResponseDto._(
              items: items.build(),
              nextCursor: BuiltValueNullFieldError.checkNotNull(nextCursor,
                  r'RecognizedFieldFilterValuesResponseDto', 'nextCursor'),
              hasMore: BuiltValueNullFieldError.checkNotNull(hasMore,
                  r'RecognizedFieldFilterValuesResponseDto', 'hasMore'),
              total: BuiltValueNullFieldError.checkNotNull(
                  total, r'RecognizedFieldFilterValuesResponseDto', 'total'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'RecognizedFieldFilterValuesResponseDto',
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
