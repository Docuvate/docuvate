// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_admin_oidc_provider_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateAdminOidcProviderRequestDto
    extends UpdateAdminOidcProviderRequestDto {
  @override
  final String displayName;
  @override
  final String issuer;
  @override
  final String clientId;
  @override
  final String? clientSecret;
  @override
  final String scopes;
  @override
  final bool enabled;

  factory _$UpdateAdminOidcProviderRequestDto(
          [void Function(UpdateAdminOidcProviderRequestDtoBuilder)? updates]) =>
      (new UpdateAdminOidcProviderRequestDtoBuilder()..update(updates))
          ._build();

  _$UpdateAdminOidcProviderRequestDto._(
      {required this.displayName,
      required this.issuer,
      required this.clientId,
      this.clientSecret,
      required this.scopes,
      required this.enabled})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        displayName, r'UpdateAdminOidcProviderRequestDto', 'displayName');
    BuiltValueNullFieldError.checkNotNull(
        issuer, r'UpdateAdminOidcProviderRequestDto', 'issuer');
    BuiltValueNullFieldError.checkNotNull(
        clientId, r'UpdateAdminOidcProviderRequestDto', 'clientId');
    BuiltValueNullFieldError.checkNotNull(
        scopes, r'UpdateAdminOidcProviderRequestDto', 'scopes');
    BuiltValueNullFieldError.checkNotNull(
        enabled, r'UpdateAdminOidcProviderRequestDto', 'enabled');
  }

  @override
  UpdateAdminOidcProviderRequestDto rebuild(
          void Function(UpdateAdminOidcProviderRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateAdminOidcProviderRequestDtoBuilder toBuilder() =>
      new UpdateAdminOidcProviderRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateAdminOidcProviderRequestDto &&
        displayName == other.displayName &&
        issuer == other.issuer &&
        clientId == other.clientId &&
        clientSecret == other.clientSecret &&
        scopes == other.scopes &&
        enabled == other.enabled;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, issuer.hashCode);
    _$hash = $jc(_$hash, clientId.hashCode);
    _$hash = $jc(_$hash, clientSecret.hashCode);
    _$hash = $jc(_$hash, scopes.hashCode);
    _$hash = $jc(_$hash, enabled.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateAdminOidcProviderRequestDto')
          ..add('displayName', displayName)
          ..add('issuer', issuer)
          ..add('clientId', clientId)
          ..add('clientSecret', clientSecret)
          ..add('scopes', scopes)
          ..add('enabled', enabled))
        .toString();
  }
}

class UpdateAdminOidcProviderRequestDtoBuilder
    implements
        Builder<UpdateAdminOidcProviderRequestDto,
            UpdateAdminOidcProviderRequestDtoBuilder> {
  _$UpdateAdminOidcProviderRequestDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _issuer;
  String? get issuer => _$this._issuer;
  set issuer(String? issuer) => _$this._issuer = issuer;

  String? _clientId;
  String? get clientId => _$this._clientId;
  set clientId(String? clientId) => _$this._clientId = clientId;

  String? _clientSecret;
  String? get clientSecret => _$this._clientSecret;
  set clientSecret(String? clientSecret) => _$this._clientSecret = clientSecret;

  String? _scopes;
  String? get scopes => _$this._scopes;
  set scopes(String? scopes) => _$this._scopes = scopes;

  bool? _enabled;
  bool? get enabled => _$this._enabled;
  set enabled(bool? enabled) => _$this._enabled = enabled;

  UpdateAdminOidcProviderRequestDtoBuilder() {
    UpdateAdminOidcProviderRequestDto._defaults(this);
  }

  UpdateAdminOidcProviderRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _issuer = $v.issuer;
      _clientId = $v.clientId;
      _clientSecret = $v.clientSecret;
      _scopes = $v.scopes;
      _enabled = $v.enabled;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateAdminOidcProviderRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UpdateAdminOidcProviderRequestDto;
  }

  @override
  void update(
      void Function(UpdateAdminOidcProviderRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateAdminOidcProviderRequestDto build() => _build();

  _$UpdateAdminOidcProviderRequestDto _build() {
    final _$result = _$v ??
        new _$UpdateAdminOidcProviderRequestDto._(
            displayName: BuiltValueNullFieldError.checkNotNull(displayName,
                r'UpdateAdminOidcProviderRequestDto', 'displayName'),
            issuer: BuiltValueNullFieldError.checkNotNull(
                issuer, r'UpdateAdminOidcProviderRequestDto', 'issuer'),
            clientId: BuiltValueNullFieldError.checkNotNull(
                clientId, r'UpdateAdminOidcProviderRequestDto', 'clientId'),
            clientSecret: clientSecret,
            scopes: BuiltValueNullFieldError.checkNotNull(
                scopes, r'UpdateAdminOidcProviderRequestDto', 'scopes'),
            enabled: BuiltValueNullFieldError.checkNotNull(
                enabled, r'UpdateAdminOidcProviderRequestDto', 'enabled'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
