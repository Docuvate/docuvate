// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'move_documents_previous_folder_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MoveDocumentsPreviousFolderDto extends MoveDocumentsPreviousFolderDto {
  @override
  final String documentId;
  @override
  final String folderId;

  factory _$MoveDocumentsPreviousFolderDto(
          [void Function(MoveDocumentsPreviousFolderDtoBuilder)? updates]) =>
      (new MoveDocumentsPreviousFolderDtoBuilder()..update(updates))._build();

  _$MoveDocumentsPreviousFolderDto._(
      {required this.documentId, required this.folderId})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        documentId, r'MoveDocumentsPreviousFolderDto', 'documentId');
    BuiltValueNullFieldError.checkNotNull(
        folderId, r'MoveDocumentsPreviousFolderDto', 'folderId');
  }

  @override
  MoveDocumentsPreviousFolderDto rebuild(
          void Function(MoveDocumentsPreviousFolderDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MoveDocumentsPreviousFolderDtoBuilder toBuilder() =>
      new MoveDocumentsPreviousFolderDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MoveDocumentsPreviousFolderDto &&
        documentId == other.documentId &&
        folderId == other.folderId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, folderId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MoveDocumentsPreviousFolderDto')
          ..add('documentId', documentId)
          ..add('folderId', folderId))
        .toString();
  }
}

class MoveDocumentsPreviousFolderDtoBuilder
    implements
        Builder<MoveDocumentsPreviousFolderDto,
            MoveDocumentsPreviousFolderDtoBuilder> {
  _$MoveDocumentsPreviousFolderDto? _$v;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  String? _folderId;
  String? get folderId => _$this._folderId;
  set folderId(String? folderId) => _$this._folderId = folderId;

  MoveDocumentsPreviousFolderDtoBuilder() {
    MoveDocumentsPreviousFolderDto._defaults(this);
  }

  MoveDocumentsPreviousFolderDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentId = $v.documentId;
      _folderId = $v.folderId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MoveDocumentsPreviousFolderDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MoveDocumentsPreviousFolderDto;
  }

  @override
  void update(void Function(MoveDocumentsPreviousFolderDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MoveDocumentsPreviousFolderDto build() => _build();

  _$MoveDocumentsPreviousFolderDto _build() {
    final _$result = _$v ??
        new _$MoveDocumentsPreviousFolderDto._(
            documentId: BuiltValueNullFieldError.checkNotNull(
                documentId, r'MoveDocumentsPreviousFolderDto', 'documentId'),
            folderId: BuiltValueNullFieldError.checkNotNull(
                folderId, r'MoveDocumentsPreviousFolderDto', 'folderId'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
