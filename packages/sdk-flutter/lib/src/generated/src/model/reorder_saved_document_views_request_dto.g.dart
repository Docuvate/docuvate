// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reorder_saved_document_views_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ReorderSavedDocumentViewsRequestDto
    extends ReorderSavedDocumentViewsRequestDto {
  @override
  final BuiltList<String> orderedIds;

  factory _$ReorderSavedDocumentViewsRequestDto(
          [void Function(ReorderSavedDocumentViewsRequestDtoBuilder)?
              updates]) =>
      (new ReorderSavedDocumentViewsRequestDtoBuilder()..update(updates))
          ._build();

  _$ReorderSavedDocumentViewsRequestDto._({required this.orderedIds})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        orderedIds, r'ReorderSavedDocumentViewsRequestDto', 'orderedIds');
  }

  @override
  ReorderSavedDocumentViewsRequestDto rebuild(
          void Function(ReorderSavedDocumentViewsRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReorderSavedDocumentViewsRequestDtoBuilder toBuilder() =>
      new ReorderSavedDocumentViewsRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReorderSavedDocumentViewsRequestDto &&
        orderedIds == other.orderedIds;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, orderedIds.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReorderSavedDocumentViewsRequestDto')
          ..add('orderedIds', orderedIds))
        .toString();
  }
}

class ReorderSavedDocumentViewsRequestDtoBuilder
    implements
        Builder<ReorderSavedDocumentViewsRequestDto,
            ReorderSavedDocumentViewsRequestDtoBuilder> {
  _$ReorderSavedDocumentViewsRequestDto? _$v;

  ListBuilder<String>? _orderedIds;
  ListBuilder<String> get orderedIds =>
      _$this._orderedIds ??= new ListBuilder<String>();
  set orderedIds(ListBuilder<String>? orderedIds) =>
      _$this._orderedIds = orderedIds;

  ReorderSavedDocumentViewsRequestDtoBuilder() {
    ReorderSavedDocumentViewsRequestDto._defaults(this);
  }

  ReorderSavedDocumentViewsRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _orderedIds = $v.orderedIds.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReorderSavedDocumentViewsRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ReorderSavedDocumentViewsRequestDto;
  }

  @override
  void update(
      void Function(ReorderSavedDocumentViewsRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReorderSavedDocumentViewsRequestDto build() => _build();

  _$ReorderSavedDocumentViewsRequestDto _build() {
    _$ReorderSavedDocumentViewsRequestDto _$result;
    try {
      _$result = _$v ??
          new _$ReorderSavedDocumentViewsRequestDto._(
              orderedIds: orderedIds.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'orderedIds';
        orderedIds.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ReorderSavedDocumentViewsRequestDto',
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
