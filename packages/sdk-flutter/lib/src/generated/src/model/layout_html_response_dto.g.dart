// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_html_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutHtmlResponseDto extends LayoutHtmlResponseDto {
  @override
  final String html;
  @override
  final bool reconstructionReliable;
  @override
  final String? unreliableReason;

  factory _$LayoutHtmlResponseDto(
          [void Function(LayoutHtmlResponseDtoBuilder)? updates]) =>
      (new LayoutHtmlResponseDtoBuilder()..update(updates))._build();

  _$LayoutHtmlResponseDto._(
      {required this.html,
      required this.reconstructionReliable,
      this.unreliableReason})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        html, r'LayoutHtmlResponseDto', 'html');
    BuiltValueNullFieldError.checkNotNull(reconstructionReliable,
        r'LayoutHtmlResponseDto', 'reconstructionReliable');
  }

  @override
  LayoutHtmlResponseDto rebuild(
          void Function(LayoutHtmlResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutHtmlResponseDtoBuilder toBuilder() =>
      new LayoutHtmlResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutHtmlResponseDto &&
        html == other.html &&
        reconstructionReliable == other.reconstructionReliable &&
        unreliableReason == other.unreliableReason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, html.hashCode);
    _$hash = $jc(_$hash, reconstructionReliable.hashCode);
    _$hash = $jc(_$hash, unreliableReason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutHtmlResponseDto')
          ..add('html', html)
          ..add('reconstructionReliable', reconstructionReliable)
          ..add('unreliableReason', unreliableReason))
        .toString();
  }
}

class LayoutHtmlResponseDtoBuilder
    implements Builder<LayoutHtmlResponseDto, LayoutHtmlResponseDtoBuilder> {
  _$LayoutHtmlResponseDto? _$v;

  String? _html;
  String? get html => _$this._html;
  set html(String? html) => _$this._html = html;

  bool? _reconstructionReliable;
  bool? get reconstructionReliable => _$this._reconstructionReliable;
  set reconstructionReliable(bool? reconstructionReliable) =>
      _$this._reconstructionReliable = reconstructionReliable;

  String? _unreliableReason;
  String? get unreliableReason => _$this._unreliableReason;
  set unreliableReason(String? unreliableReason) =>
      _$this._unreliableReason = unreliableReason;

  LayoutHtmlResponseDtoBuilder() {
    LayoutHtmlResponseDto._defaults(this);
  }

  LayoutHtmlResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _html = $v.html;
      _reconstructionReliable = $v.reconstructionReliable;
      _unreliableReason = $v.unreliableReason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutHtmlResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
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
        new _$LayoutHtmlResponseDto._(
            html: BuiltValueNullFieldError.checkNotNull(
                html, r'LayoutHtmlResponseDto', 'html'),
            reconstructionReliable: BuiltValueNullFieldError.checkNotNull(
                reconstructionReliable,
                r'LayoutHtmlResponseDto',
                'reconstructionReliable'),
            unreliableReason: unreliableReason);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
