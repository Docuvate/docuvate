// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_list_library_ui_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentListLibraryUiDto extends DocumentListLibraryUiDto {
  @override
  final bool showDocumentOwnerLine;

  factory _$DocumentListLibraryUiDto(
          [void Function(DocumentListLibraryUiDtoBuilder)? updates]) =>
      (new DocumentListLibraryUiDtoBuilder()..update(updates))._build();

  _$DocumentListLibraryUiDto._({required this.showDocumentOwnerLine})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(showDocumentOwnerLine,
        r'DocumentListLibraryUiDto', 'showDocumentOwnerLine');
  }

  @override
  DocumentListLibraryUiDto rebuild(
          void Function(DocumentListLibraryUiDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentListLibraryUiDtoBuilder toBuilder() =>
      new DocumentListLibraryUiDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentListLibraryUiDto &&
        showDocumentOwnerLine == other.showDocumentOwnerLine;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, showDocumentOwnerLine.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentListLibraryUiDto')
          ..add('showDocumentOwnerLine', showDocumentOwnerLine))
        .toString();
  }
}

class DocumentListLibraryUiDtoBuilder
    implements
        Builder<DocumentListLibraryUiDto, DocumentListLibraryUiDtoBuilder> {
  _$DocumentListLibraryUiDto? _$v;

  bool? _showDocumentOwnerLine;
  bool? get showDocumentOwnerLine => _$this._showDocumentOwnerLine;
  set showDocumentOwnerLine(bool? showDocumentOwnerLine) =>
      _$this._showDocumentOwnerLine = showDocumentOwnerLine;

  DocumentListLibraryUiDtoBuilder() {
    DocumentListLibraryUiDto._defaults(this);
  }

  DocumentListLibraryUiDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _showDocumentOwnerLine = $v.showDocumentOwnerLine;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentListLibraryUiDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentListLibraryUiDto;
  }

  @override
  void update(void Function(DocumentListLibraryUiDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentListLibraryUiDto build() => _build();

  _$DocumentListLibraryUiDto _build() {
    final _$result = _$v ??
        new _$DocumentListLibraryUiDto._(
            showDocumentOwnerLine: BuiltValueNullFieldError.checkNotNull(
                showDocumentOwnerLine,
                r'DocumentListLibraryUiDto',
                'showDocumentOwnerLine'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
