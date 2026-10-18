// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_sign_in_options_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthSignInOptionsResponseDto extends AuthSignInOptionsResponseDto {
  @override
  final bool passkeysEnabled;
  @override
  final BuiltList<AuthOidcProviderPublicResponseDto> oidcProviders;
  @override
  final bool emailChangeAvailable;

  factory _$AuthSignInOptionsResponseDto(
          [void Function(AuthSignInOptionsResponseDtoBuilder)? updates]) =>
      (new AuthSignInOptionsResponseDtoBuilder()..update(updates))._build();

  _$AuthSignInOptionsResponseDto._(
      {required this.passkeysEnabled,
      required this.oidcProviders,
      required this.emailChangeAvailable})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        passkeysEnabled, r'AuthSignInOptionsResponseDto', 'passkeysEnabled');
    BuiltValueNullFieldError.checkNotNull(
        oidcProviders, r'AuthSignInOptionsResponseDto', 'oidcProviders');
    BuiltValueNullFieldError.checkNotNull(emailChangeAvailable,
        r'AuthSignInOptionsResponseDto', 'emailChangeAvailable');
  }

  @override
  AuthSignInOptionsResponseDto rebuild(
          void Function(AuthSignInOptionsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthSignInOptionsResponseDtoBuilder toBuilder() =>
      new AuthSignInOptionsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthSignInOptionsResponseDto &&
        passkeysEnabled == other.passkeysEnabled &&
        oidcProviders == other.oidcProviders &&
        emailChangeAvailable == other.emailChangeAvailable;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, passkeysEnabled.hashCode);
    _$hash = $jc(_$hash, oidcProviders.hashCode);
    _$hash = $jc(_$hash, emailChangeAvailable.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthSignInOptionsResponseDto')
          ..add('passkeysEnabled', passkeysEnabled)
          ..add('oidcProviders', oidcProviders)
          ..add('emailChangeAvailable', emailChangeAvailable))
        .toString();
  }
}

class AuthSignInOptionsResponseDtoBuilder
    implements
        Builder<AuthSignInOptionsResponseDto,
            AuthSignInOptionsResponseDtoBuilder> {
  _$AuthSignInOptionsResponseDto? _$v;

  bool? _passkeysEnabled;
  bool? get passkeysEnabled => _$this._passkeysEnabled;
  set passkeysEnabled(bool? passkeysEnabled) =>
      _$this._passkeysEnabled = passkeysEnabled;

  ListBuilder<AuthOidcProviderPublicResponseDto>? _oidcProviders;
  ListBuilder<AuthOidcProviderPublicResponseDto> get oidcProviders =>
      _$this._oidcProviders ??=
          new ListBuilder<AuthOidcProviderPublicResponseDto>();
  set oidcProviders(
          ListBuilder<AuthOidcProviderPublicResponseDto>? oidcProviders) =>
      _$this._oidcProviders = oidcProviders;

  bool? _emailChangeAvailable;
  bool? get emailChangeAvailable => _$this._emailChangeAvailable;
  set emailChangeAvailable(bool? emailChangeAvailable) =>
      _$this._emailChangeAvailable = emailChangeAvailable;

  AuthSignInOptionsResponseDtoBuilder() {
    AuthSignInOptionsResponseDto._defaults(this);
  }

  AuthSignInOptionsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _passkeysEnabled = $v.passkeysEnabled;
      _oidcProviders = $v.oidcProviders.toBuilder();
      _emailChangeAvailable = $v.emailChangeAvailable;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthSignInOptionsResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AuthSignInOptionsResponseDto;
  }

  @override
  void update(void Function(AuthSignInOptionsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthSignInOptionsResponseDto build() => _build();

  _$AuthSignInOptionsResponseDto _build() {
    _$AuthSignInOptionsResponseDto _$result;
    try {
      _$result = _$v ??
          new _$AuthSignInOptionsResponseDto._(
              passkeysEnabled: BuiltValueNullFieldError.checkNotNull(
                  passkeysEnabled,
                  r'AuthSignInOptionsResponseDto',
                  'passkeysEnabled'),
              oidcProviders: oidcProviders.build(),
              emailChangeAvailable: BuiltValueNullFieldError.checkNotNull(
                  emailChangeAvailable,
                  r'AuthSignInOptionsResponseDto',
                  'emailChangeAvailable'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'oidcProviders';
        oidcProviders.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'AuthSignInOptionsResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
