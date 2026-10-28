// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_oidc_provider_public_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AuthOidcProviderPublicResponseDto
    extends AuthOidcProviderPublicResponseDto {
  @override
  final String providerId;
  @override
  final String displayName;

  factory _$AuthOidcProviderPublicResponseDto(
          [void Function(AuthOidcProviderPublicResponseDtoBuilder)? updates]) =>
      (new AuthOidcProviderPublicResponseDtoBuilder()..update(updates))
          ._build();

  _$AuthOidcProviderPublicResponseDto._(
      {required this.providerId, required this.displayName})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        providerId, r'AuthOidcProviderPublicResponseDto', 'providerId');
    BuiltValueNullFieldError.checkNotNull(
        displayName, r'AuthOidcProviderPublicResponseDto', 'displayName');
  }

  @override
  AuthOidcProviderPublicResponseDto rebuild(
          void Function(AuthOidcProviderPublicResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AuthOidcProviderPublicResponseDtoBuilder toBuilder() =>
      new AuthOidcProviderPublicResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AuthOidcProviderPublicResponseDto &&
        providerId == other.providerId &&
        displayName == other.displayName;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, providerId.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AuthOidcProviderPublicResponseDto')
          ..add('providerId', providerId)
          ..add('displayName', displayName))
        .toString();
  }
}

class AuthOidcProviderPublicResponseDtoBuilder
    implements
        Builder<AuthOidcProviderPublicResponseDto,
            AuthOidcProviderPublicResponseDtoBuilder> {
  _$AuthOidcProviderPublicResponseDto? _$v;

  String? _providerId;
  String? get providerId => _$this._providerId;
  set providerId(String? providerId) => _$this._providerId = providerId;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  AuthOidcProviderPublicResponseDtoBuilder() {
    AuthOidcProviderPublicResponseDto._defaults(this);
  }

  AuthOidcProviderPublicResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _providerId = $v.providerId;
      _displayName = $v.displayName;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AuthOidcProviderPublicResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AuthOidcProviderPublicResponseDto;
  }

  @override
  void update(
      void Function(AuthOidcProviderPublicResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AuthOidcProviderPublicResponseDto build() => _build();

  _$AuthOidcProviderPublicResponseDto _build() {
    final _$result = _$v ??
        new _$AuthOidcProviderPublicResponseDto._(
            providerId: BuiltValueNullFieldError.checkNotNull(
                providerId, r'AuthOidcProviderPublicResponseDto', 'providerId'),
            displayName: BuiltValueNullFieldError.checkNotNull(displayName,
                r'AuthOidcProviderPublicResponseDto', 'displayName'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
