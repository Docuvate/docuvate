// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_html_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutHtmlResponseDto extends LayoutHtmlResponseDto {
  @override
  final String html;

  factory _$LayoutHtmlResponseDto(
          [void Function(LayoutHtmlResponseDtoBuilder)? updates]) =>
      (LayoutHtmlResponseDtoBuilder()..update(updates))._build();

  _$LayoutHtmlResponseDto._({required this.html}) : super._();
  @override
  LayoutHtmlResponseDto rebuild(
          void Function(LayoutHtmlResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutHtmlResponseDtoBuilder toBuilder() =>
      LayoutHtmlResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutHtmlResponseDto && html == other.html;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, html.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutHtmlResponseDto')
          ..add('html', html))
        .toString();
  }
}

class LayoutHtmlResponseDtoBuilder
    implements Builder<LayoutHtmlResponseDto, LayoutHtmlResponseDtoBuilder> {
  _$LayoutHtmlResponseDto? _$v;

  String? _html;
  String? get html => _$this._html;
  set html(String? html) => _$this._html = html;

  LayoutHtmlResponseDtoBuilder() {
    LayoutHtmlResponseDto._defaults(this);
  }

  LayoutHtmlResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _html = $v.html;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutHtmlResponseDto other) {
    _$v = other as _$LayoutHtmlResponseDto;
  }

  @override
  void update(void Function(LayoutHtmlResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutHtmlResponseDto build() => _build();

  _$LayoutHtmlResponseDto _build() {
    final _$result = _$v ??
        _$LayoutHtmlResponseDto._(
          html: BuiltValueNullFieldError.checkNotNull(
              html, r'LayoutHtmlResponseDto', 'html'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
