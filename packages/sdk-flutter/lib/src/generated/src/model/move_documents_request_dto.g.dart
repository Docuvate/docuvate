// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'move_documents_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MoveDocumentsRequestDto extends MoveDocumentsRequestDto {
  @override
  final BuiltList<String> documentIds;
  @override
  final String? folderId;

  factory _$MoveDocumentsRequestDto(
          [void Function(MoveDocumentsRequestDtoBuilder)? updates]) =>
      (new MoveDocumentsRequestDtoBuilder()..update(updates))._build();

  _$MoveDocumentsRequestDto._({required this.documentIds, this.folderId})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        documentIds, r'MoveDocumentsRequestDto', 'documentIds');
  }

  @override
  MoveDocumentsRequestDto rebuild(
          void Function(MoveDocumentsRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MoveDocumentsRequestDtoBuilder toBuilder() =>
      new MoveDocumentsRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MoveDocumentsRequestDto &&
        documentIds == other.documentIds &&
        folderId == other.folderId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentIds.hashCode);
    _$hash = $jc(_$hash, folderId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MoveDocumentsRequestDto')
          ..add('documentIds', documentIds)
          ..add('folderId', folderId))
        .toString();
  }
}

class MoveDocumentsRequestDtoBuilder
    implements
        Builder<MoveDocumentsRequestDto, MoveDocumentsRequestDtoBuilder> {
  _$MoveDocumentsRequestDto? _$v;

  ListBuilder<String>? _documentIds;
  ListBuilder<String> get documentIds =>
      _$this._documentIds ??= new ListBuilder<String>();
  set documentIds(ListBuilder<String>? documentIds) =>
      _$this._documentIds = documentIds;

  String? _folderId;
  String? get folderId => _$this._folderId;
  set folderId(String? folderId) => _$this._folderId = folderId;

  MoveDocumentsRequestDtoBuilder() {
    MoveDocumentsRequestDto._defaults(this);
  }

  MoveDocumentsRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentIds = $v.documentIds.toBuilder();
      _folderId = $v.folderId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MoveDocumentsRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MoveDocumentsRequestDto;
  }

  @override
  void update(void Function(MoveDocumentsRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MoveDocumentsRequestDto build() => _build();

  _$MoveDocumentsRequestDto _build() {
    _$MoveDocumentsRequestDto _$result;
    try {
      _$result = _$v ??
          new _$MoveDocumentsRequestDto._(
              documentIds: documentIds.build(), folderId: folderId);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'documentIds';
        documentIds.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'MoveDocumentsRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
