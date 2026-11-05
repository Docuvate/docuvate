// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_layout_tokens_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentLayoutTokensResponseDto
    extends DocumentLayoutTokensResponseDto {
  @override
  final num page;
  @override
  final String irSha256;
  @override
  final BuiltList<LayoutTokenDto> tokens;

  factory _$DocumentLayoutTokensResponseDto(
          [void Function(DocumentLayoutTokensResponseDtoBuilder)? updates]) =>
      (new DocumentLayoutTokensResponseDtoBuilder()..update(updates))._build();

  _$DocumentLayoutTokensResponseDto._(
      {required this.page, required this.irSha256, required this.tokens})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        page, r'DocumentLayoutTokensResponseDto', 'page');
    BuiltValueNullFieldError.checkNotNull(
        irSha256, r'DocumentLayoutTokensResponseDto', 'irSha256');
    BuiltValueNullFieldError.checkNotNull(
        tokens, r'DocumentLayoutTokensResponseDto', 'tokens');
  }

  @override
  DocumentLayoutTokensResponseDto rebuild(
          void Function(DocumentLayoutTokensResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentLayoutTokensResponseDtoBuilder toBuilder() =>
      new DocumentLayoutTokensResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentLayoutTokensResponseDto &&
        page == other.page &&
        irSha256 == other.irSha256 &&
        tokens == other.tokens;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, irSha256.hashCode);
    _$hash = $jc(_$hash, tokens.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentLayoutTokensResponseDto')
          ..add('page', page)
          ..add('irSha256', irSha256)
          ..add('tokens', tokens))
        .toString();
  }
}

class DocumentLayoutTokensResponseDtoBuilder
    implements
        Builder<DocumentLayoutTokensResponseDto,
            DocumentLayoutTokensResponseDtoBuilder> {
  _$DocumentLayoutTokensResponseDto? _$v;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  String? _irSha256;
  String? get irSha256 => _$this._irSha256;
  set irSha256(String? irSha256) => _$this._irSha256 = irSha256;

  ListBuilder<LayoutTokenDto>? _tokens;
  ListBuilder<LayoutTokenDto> get tokens =>
      _$this._tokens ??= new ListBuilder<LayoutTokenDto>();
  set tokens(ListBuilder<LayoutTokenDto>? tokens) => _$this._tokens = tokens;

  DocumentLayoutTokensResponseDtoBuilder() {
    DocumentLayoutTokensResponseDto._defaults(this);
  }

  DocumentLayoutTokensResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _page = $v.page;
      _irSha256 = $v.irSha256;
      _tokens = $v.tokens.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentLayoutTokensResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentLayoutTokensResponseDto;
  }

  @override
  void update(void Function(DocumentLayoutTokensResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentLayoutTokensResponseDto build() => _build();

  _$DocumentLayoutTokensResponseDto _build() {
    _$DocumentLayoutTokensResponseDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentLayoutTokensResponseDto._(
              page: BuiltValueNullFieldError.checkNotNull(
                  page, r'DocumentLayoutTokensResponseDto', 'page'),
              irSha256: BuiltValueNullFieldError.checkNotNull(
                  irSha256, r'DocumentLayoutTokensResponseDto', 'irSha256'),
              tokens: tokens.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tokens';
        tokens.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentLayoutTokensResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
