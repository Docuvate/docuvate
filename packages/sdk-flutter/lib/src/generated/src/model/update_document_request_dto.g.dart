// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_document_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateDocumentRequestDto extends UpdateDocumentRequestDto {
  @override
  final String? title;
  @override
  final String? documentDate;
  @override
  final String? notes;
  @override
  final String? folderId;
  @override
  final String? mappeId;
  @override
  final String? correspondentId;
  @override
  final BuiltList<String>? tagIds;
  @override
  final BuiltList<ExtractedFieldDto>? extractionFields;
  @override
  final BuiltList<ExtractionBlockDto>? extractionBlocks;

  factory _$UpdateDocumentRequestDto(
          [void Function(UpdateDocumentRequestDtoBuilder)? updates]) =>
      (UpdateDocumentRequestDtoBuilder()..update(updates))._build();

  _$UpdateDocumentRequestDto._(
      {this.title,
      this.documentDate,
      this.notes,
      this.folderId,
      this.mappeId,
      this.correspondentId,
      this.tagIds,
      this.extractionFields,
      this.extractionBlocks})
      : super._();
  @override
  UpdateDocumentRequestDto rebuild(
          void Function(UpdateDocumentRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateDocumentRequestDtoBuilder toBuilder() =>
      UpdateDocumentRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateDocumentRequestDto &&
        title == other.title &&
        documentDate == other.documentDate &&
        notes == other.notes &&
        folderId == other.folderId &&
        mappeId == other.mappeId &&
        correspondentId == other.correspondentId &&
        tagIds == other.tagIds &&
        extractionFields == other.extractionFields &&
        extractionBlocks == other.extractionBlocks;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, documentDate.hashCode);
    _$hash = $jc(_$hash, notes.hashCode);
    _$hash = $jc(_$hash, folderId.hashCode);
    _$hash = $jc(_$hash, mappeId.hashCode);
    _$hash = $jc(_$hash, correspondentId.hashCode);
    _$hash = $jc(_$hash, tagIds.hashCode);
    _$hash = $jc(_$hash, extractionFields.hashCode);
    _$hash = $jc(_$hash, extractionBlocks.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateDocumentRequestDto')
          ..add('title', title)
          ..add('documentDate', documentDate)
          ..add('notes', notes)
          ..add('folderId', folderId)
          ..add('mappeId', mappeId)
          ..add('correspondentId', correspondentId)
          ..add('tagIds', tagIds)
          ..add('extractionFields', extractionFields)
          ..add('extractionBlocks', extractionBlocks))
        .toString();
  }
}

class UpdateDocumentRequestDtoBuilder
    implements
        Builder<UpdateDocumentRequestDto, UpdateDocumentRequestDtoBuilder> {
  _$UpdateDocumentRequestDto? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _documentDate;
  String? get documentDate => _$this._documentDate;
  set documentDate(String? documentDate) => _$this._documentDate = documentDate;

  String? _notes;
  String? get notes => _$this._notes;
  set notes(String? notes) => _$this._notes = notes;

  String? _folderId;
  String? get folderId => _$this._folderId;
  set folderId(String? folderId) => _$this._folderId = folderId;

  String? _mappeId;
  String? get mappeId => _$this._mappeId;
  set mappeId(String? mappeId) => _$this._mappeId = mappeId;

  String? _correspondentId;
  String? get correspondentId => _$this._correspondentId;
  set correspondentId(String? correspondentId) =>
      _$this._correspondentId = correspondentId;

  ListBuilder<String>? _tagIds;
  ListBuilder<String> get tagIds => _$this._tagIds ??= ListBuilder<String>();
  set tagIds(ListBuilder<String>? tagIds) => _$this._tagIds = tagIds;

  ListBuilder<ExtractedFieldDto>? _extractionFields;
  ListBuilder<ExtractedFieldDto> get extractionFields =>
      _$this._extractionFields ??= ListBuilder<ExtractedFieldDto>();
  set extractionFields(ListBuilder<ExtractedFieldDto>? extractionFields) =>
      _$this._extractionFields = extractionFields;

  ListBuilder<ExtractionBlockDto>? _extractionBlocks;
  ListBuilder<ExtractionBlockDto> get extractionBlocks =>
      _$this._extractionBlocks ??= ListBuilder<ExtractionBlockDto>();
  set extractionBlocks(ListBuilder<ExtractionBlockDto>? extractionBlocks) =>
      _$this._extractionBlocks = extractionBlocks;

  UpdateDocumentRequestDtoBuilder() {
    UpdateDocumentRequestDto._defaults(this);
  }

  UpdateDocumentRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _documentDate = $v.documentDate;
      _notes = $v.notes;
      _folderId = $v.folderId;
      _mappeId = $v.mappeId;
      _correspondentId = $v.correspondentId;
      _tagIds = $v.tagIds?.toBuilder();
      _extractionFields = $v.extractionFields?.toBuilder();
      _extractionBlocks = $v.extractionBlocks?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateDocumentRequestDto other) {
    _$v = other as _$UpdateDocumentRequestDto;
  }

  @override
  void update(void Function(UpdateDocumentRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateDocumentRequestDto build() => _build();

  _$UpdateDocumentRequestDto _build() {
    _$UpdateDocumentRequestDto _$result;
    try {
      _$result = _$v ??
          _$UpdateDocumentRequestDto._(
            title: title,
            documentDate: documentDate,
            notes: notes,
            folderId: folderId,
            mappeId: mappeId,
            correspondentId: correspondentId,
            tagIds: _tagIds?.build(),
            extractionFields: _extractionFields?.build(),
            extractionBlocks: _extractionBlocks?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tagIds';
        _tagIds?.build();
        _$failedField = 'extractionFields';
        _extractionFields?.build();
        _$failedField = 'extractionBlocks';
        _extractionBlocks?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UpdateDocumentRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
