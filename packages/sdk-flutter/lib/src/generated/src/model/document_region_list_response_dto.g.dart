// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentRegionListResponseDto extends DocumentRegionListResponseDto {
  @override
  final String irSha256;
  @override
  final BuiltList<DocumentRegionDto> items;

  factory _$DocumentRegionListResponseDto(
          [void Function(DocumentRegionListResponseDtoBuilder)? updates]) =>
      (new DocumentRegionListResponseDtoBuilder()..update(updates))._build();

  _$DocumentRegionListResponseDto._(
      {required this.irSha256, required this.items})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        irSha256, r'DocumentRegionListResponseDto', 'irSha256');
    BuiltValueNullFieldError.checkNotNull(
        items, r'DocumentRegionListResponseDto', 'items');
  }

  @override
  DocumentRegionListResponseDto rebuild(
          void Function(DocumentRegionListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionListResponseDtoBuilder toBuilder() =>
      new DocumentRegionListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionListResponseDto &&
        irSha256 == other.irSha256 &&
        items == other.items;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, irSha256.hashCode);
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionListResponseDto')
          ..add('irSha256', irSha256)
          ..add('items', items))
        .toString();
  }
}

class DocumentRegionListResponseDtoBuilder
    implements
        Builder<DocumentRegionListResponseDto,
            DocumentRegionListResponseDtoBuilder> {
  _$DocumentRegionListResponseDto? _$v;

  String? _irSha256;
  String? get irSha256 => _$this._irSha256;
  set irSha256(String? irSha256) => _$this._irSha256 = irSha256;

  ListBuilder<DocumentRegionDto>? _items;
  ListBuilder<DocumentRegionDto> get items =>
      _$this._items ??= new ListBuilder<DocumentRegionDto>();
  set items(ListBuilder<DocumentRegionDto>? items) => _$this._items = items;

  DocumentRegionListResponseDtoBuilder() {
    DocumentRegionListResponseDto._defaults(this);
  }

  DocumentRegionListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _irSha256 = $v.irSha256;
      _items = $v.items.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentRegionListResponseDto;
  }

  @override
  void update(void Function(DocumentRegionListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionListResponseDto build() => _build();

  _$DocumentRegionListResponseDto _build() {
    _$DocumentRegionListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentRegionListResponseDto._(
              irSha256: BuiltValueNullFieldError.checkNotNull(
                  irSha256, r'DocumentRegionListResponseDto', 'irSha256'),
              items: items.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentRegionListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
