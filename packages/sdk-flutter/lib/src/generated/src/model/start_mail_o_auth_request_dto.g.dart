// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'start_mail_o_auth_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StartMailOAuthRequestDto extends StartMailOAuthRequestDto {
  @override
  final String displayName;
  @override
  final String? accountHint;

  factory _$StartMailOAuthRequestDto(
          [void Function(StartMailOAuthRequestDtoBuilder)? updates]) =>
      (new StartMailOAuthRequestDtoBuilder()..update(updates))._build();

  _$StartMailOAuthRequestDto._({required this.displayName, this.accountHint})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        displayName, r'StartMailOAuthRequestDto', 'displayName');
  }

  @override
  StartMailOAuthRequestDto rebuild(
          void Function(StartMailOAuthRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StartMailOAuthRequestDtoBuilder toBuilder() =>
      new StartMailOAuthRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StartMailOAuthRequestDto &&
        displayName == other.displayName &&
        accountHint == other.accountHint;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, accountHint.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StartMailOAuthRequestDto')
          ..add('displayName', displayName)
          ..add('accountHint', accountHint))
        .toString();
  }
}

class StartMailOAuthRequestDtoBuilder
    implements
        Builder<StartMailOAuthRequestDto, StartMailOAuthRequestDtoBuilder> {
  _$StartMailOAuthRequestDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _accountHint;
  String? get accountHint => _$this._accountHint;
  set accountHint(String? accountHint) => _$this._accountHint = accountHint;

  StartMailOAuthRequestDtoBuilder() {
    StartMailOAuthRequestDto._defaults(this);
  }

  StartMailOAuthRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _accountHint = $v.accountHint;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StartMailOAuthRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$StartMailOAuthRequestDto;
  }

  @override
  void update(void Function(StartMailOAuthRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StartMailOAuthRequestDto build() => _build();

  _$StartMailOAuthRequestDto _build() {
    final _$result = _$v ??
        new _$StartMailOAuthRequestDto._(
            displayName: BuiltValueNullFieldError.checkNotNull(
                displayName, r'StartMailOAuthRequestDto', 'displayName'),
            accountHint: accountHint);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
