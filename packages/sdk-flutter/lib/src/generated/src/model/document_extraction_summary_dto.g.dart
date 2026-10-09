// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_extraction_summary_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentExtractionSummaryDto extends DocumentExtractionSummaryDto {
  @override
  final String text;
  @override
  final BuiltList<ExtractedFieldDto> fields;
  @override
  final String? markdown;
  @override
  final bool? layoutIrAvailable;
  @override
  final BuiltList<DocumentExtractionSummaryDtoLayoutIrPagesInner>?
      layoutIrPages;

  factory _$DocumentExtractionSummaryDto(
          [void Function(DocumentExtractionSummaryDtoBuilder)? updates]) =>
      (new DocumentExtractionSummaryDtoBuilder()..update(updates))._build();

  _$DocumentExtractionSummaryDto._(
      {required this.text,
      required this.fields,
      this.markdown,
      this.layoutIrAvailable,
      this.layoutIrPages})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        text, r'DocumentExtractionSummaryDto', 'text');
    BuiltValueNullFieldError.checkNotNull(
        fields, r'DocumentExtractionSummaryDto', 'fields');
  }

  @override
  DocumentExtractionSummaryDto rebuild(
          void Function(DocumentExtractionSummaryDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentExtractionSummaryDtoBuilder toBuilder() =>
      new DocumentExtractionSummaryDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentExtractionSummaryDto &&
        text == other.text &&
        fields == other.fields &&
        markdown == other.markdown &&
        layoutIrAvailable == other.layoutIrAvailable &&
        layoutIrPages == other.layoutIrPages;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, text.hashCode);
    _$hash = $jc(_$hash, fields.hashCode);
    _$hash = $jc(_$hash, markdown.hashCode);
    _$hash = $jc(_$hash, layoutIrAvailable.hashCode);
    _$hash = $jc(_$hash, layoutIrPages.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentExtractionSummaryDto')
          ..add('text', text)
          ..add('fields', fields)
          ..add('markdown', markdown)
          ..add('layoutIrAvailable', layoutIrAvailable)
          ..add('layoutIrPages', layoutIrPages))
        .toString();
  }
}

class DocumentExtractionSummaryDtoBuilder
    implements
        Builder<DocumentExtractionSummaryDto,
            DocumentExtractionSummaryDtoBuilder> {
  _$DocumentExtractionSummaryDto? _$v;

  String? _text;
  String? get text => _$this._text;
  set text(String? text) => _$this._text = text;

  ListBuilder<ExtractedFieldDto>? _fields;
  ListBuilder<ExtractedFieldDto> get fields =>
      _$this._fields ??= new ListBuilder<ExtractedFieldDto>();
  set fields(ListBuilder<ExtractedFieldDto>? fields) => _$this._fields = fields;

  String? _markdown;
  String? get markdown => _$this._markdown;
  set markdown(String? markdown) => _$this._markdown = markdown;

  bool? _layoutIrAvailable;
  bool? get layoutIrAvailable => _$this._layoutIrAvailable;
  set layoutIrAvailable(bool? layoutIrAvailable) =>
      _$this._layoutIrAvailable = layoutIrAvailable;

  ListBuilder<DocumentExtractionSummaryDtoLayoutIrPagesInner>? _layoutIrPages;
  ListBuilder<DocumentExtractionSummaryDtoLayoutIrPagesInner>
      get layoutIrPages => _$this._layoutIrPages ??=
          new ListBuilder<DocumentExtractionSummaryDtoLayoutIrPagesInner>();
  set layoutIrPages(
          ListBuilder<DocumentExtractionSummaryDtoLayoutIrPagesInner>?
              layoutIrPages) =>
      _$this._layoutIrPages = layoutIrPages;

  DocumentExtractionSummaryDtoBuilder() {
    DocumentExtractionSummaryDto._defaults(this);
  }

  DocumentExtractionSummaryDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _text = $v.text;
      _fields = $v.fields.toBuilder();
      _markdown = $v.markdown;
      _layoutIrAvailable = $v.layoutIrAvailable;
      _layoutIrPages = $v.layoutIrPages?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentExtractionSummaryDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentExtractionSummaryDto;
  }

  @override
  void update(void Function(DocumentExtractionSummaryDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentExtractionSummaryDto build() => _build();

  _$DocumentExtractionSummaryDto _build() {
    _$DocumentExtractionSummaryDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentExtractionSummaryDto._(
              text: BuiltValueNullFieldError.checkNotNull(
                  text, r'DocumentExtractionSummaryDto', 'text'),
              fields: fields.build(),
              markdown: markdown,
              layoutIrAvailable: layoutIrAvailable,
              layoutIrPages: _layoutIrPages?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'fields';
        fields.build();

        _$failedField = 'layoutIrPages';
        _layoutIrPages?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentExtractionSummaryDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
