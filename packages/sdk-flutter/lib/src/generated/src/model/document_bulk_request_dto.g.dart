// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_bulk_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentBulkRequestDto extends DocumentBulkRequestDto {
  @override
  final BuiltList<String> ids;
  @override
  final DocumentBulkActionDto bulk;

  factory _$DocumentBulkRequestDto(
          [void Function(DocumentBulkRequestDtoBuilder)? updates]) =>
      (DocumentBulkRequestDtoBuilder()..update(updates))._build();

  _$DocumentBulkRequestDto._({required this.ids, required this.bulk})
      : super._();
  @override
  DocumentBulkRequestDto rebuild(
          void Function(DocumentBulkRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentBulkRequestDtoBuilder toBuilder() =>
      DocumentBulkRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentBulkRequestDto &&
        ids == other.ids &&
        bulk == other.bulk;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ids.hashCode);
    _$hash = $jc(_$hash, bulk.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentBulkRequestDto')
          ..add('ids', ids)
          ..add('bulk', bulk))
        .toString();
  }
}

class DocumentBulkRequestDtoBuilder
    implements Builder<DocumentBulkRequestDto, DocumentBulkRequestDtoBuilder> {
  _$DocumentBulkRequestDto? _$v;

  ListBuilder<String>? _ids;
  ListBuilder<String> get ids => _$this._ids ??= ListBuilder<String>();
  set ids(ListBuilder<String>? ids) => _$this._ids = ids;

  DocumentBulkActionDtoBuilder? _bulk;
  DocumentBulkActionDtoBuilder get bulk =>
      _$this._bulk ??= DocumentBulkActionDtoBuilder();
  set bulk(DocumentBulkActionDtoBuilder? bulk) => _$this._bulk = bulk;

  DocumentBulkRequestDtoBuilder() {
    DocumentBulkRequestDto._defaults(this);
  }

  DocumentBulkRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ids = $v.ids.toBuilder();
      _bulk = $v.bulk.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentBulkRequestDto other) {
    _$v = other as _$DocumentBulkRequestDto;
  }

  @override
  void update(void Function(DocumentBulkRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentBulkRequestDto build() => _build();

  _$DocumentBulkRequestDto _build() {
    _$DocumentBulkRequestDto _$result;
    try {
      _$result = _$v ??
          _$DocumentBulkRequestDto._(
            ids: ids.build(),
            bulk: bulk.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'ids';
        ids.build();
        _$failedField = 'bulk';
        bulk.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentBulkRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
