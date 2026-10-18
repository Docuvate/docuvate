// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_auth_sign_in_settings_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminAuthSignInSettingsResponseDto
    extends AdminAuthSignInSettingsResponseDto {
  @override
  final bool passkeysEnabled;
  @override
  final BuiltList<AdminOidcProviderResponseDto> oidcProviders;

  factory _$AdminAuthSignInSettingsResponseDto(
          [void Function(AdminAuthSignInSettingsResponseDtoBuilder)?
              updates]) =>
      (new AdminAuthSignInSettingsResponseDtoBuilder()..update(updates))
          ._build();

  _$AdminAuthSignInSettingsResponseDto._(
      {required this.passkeysEnabled, required this.oidcProviders})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(passkeysEnabled,
        r'AdminAuthSignInSettingsResponseDto', 'passkeysEnabled');
    BuiltValueNullFieldError.checkNotNull(
        oidcProviders, r'AdminAuthSignInSettingsResponseDto', 'oidcProviders');
  }

  @override
  AdminAuthSignInSettingsResponseDto rebuild(
          void Function(AdminAuthSignInSettingsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminAuthSignInSettingsResponseDtoBuilder toBuilder() =>
      new AdminAuthSignInSettingsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminAuthSignInSettingsResponseDto &&
        passkeysEnabled == other.passkeysEnabled &&
        oidcProviders == other.oidcProviders;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, passkeysEnabled.hashCode);
    _$hash = $jc(_$hash, oidcProviders.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminAuthSignInSettingsResponseDto')
          ..add('passkeysEnabled', passkeysEnabled)
          ..add('oidcProviders', oidcProviders))
        .toString();
  }
}

class AdminAuthSignInSettingsResponseDtoBuilder
    implements
        Builder<AdminAuthSignInSettingsResponseDto,
            AdminAuthSignInSettingsResponseDtoBuilder> {
  _$AdminAuthSignInSettingsResponseDto? _$v;

  bool? _passkeysEnabled;
  bool? get passkeysEnabled => _$this._passkeysEnabled;
  set passkeysEnabled(bool? passkeysEnabled) =>
      _$this._passkeysEnabled = passkeysEnabled;

  ListBuilder<AdminOidcProviderResponseDto>? _oidcProviders;
  ListBuilder<AdminOidcProviderResponseDto> get oidcProviders =>
      _$this._oidcProviders ??= new ListBuilder<AdminOidcProviderResponseDto>();
  set oidcProviders(ListBuilder<AdminOidcProviderResponseDto>? oidcProviders) =>
      _$this._oidcProviders = oidcProviders;

  AdminAuthSignInSettingsResponseDtoBuilder() {
    AdminAuthSignInSettingsResponseDto._defaults(this);
  }

  AdminAuthSignInSettingsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _passkeysEnabled = $v.passkeysEnabled;
      _oidcProviders = $v.oidcProviders.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminAuthSignInSettingsResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AdminAuthSignInSettingsResponseDto;
  }

  @override
  void update(
      void Function(AdminAuthSignInSettingsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminAuthSignInSettingsResponseDto build() => _build();

  _$AdminAuthSignInSettingsResponseDto _build() {
    _$AdminAuthSignInSettingsResponseDto _$result;
    try {
      _$result = _$v ??
          new _$AdminAuthSignInSettingsResponseDto._(
              passkeysEnabled: BuiltValueNullFieldError.checkNotNull(
                  passkeysEnabled,
                  r'AdminAuthSignInSettingsResponseDto',
                  'passkeysEnabled'),
              oidcProviders: oidcProviders.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'oidcProviders';
        oidcProviders.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'AdminAuthSignInSettingsResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
