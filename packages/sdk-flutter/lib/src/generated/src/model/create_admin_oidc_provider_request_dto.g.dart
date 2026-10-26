// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_admin_oidc_provider_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateAdminOidcProviderRequestDto
    extends CreateAdminOidcProviderRequestDto {
  @override
  final String providerId;
  @override
  final String displayName;
  @override
  final String issuer;
  @override
  final String clientId;
  @override
  final String clientSecret;
  @override
  final String scopes;
  @override
  final bool enabled;

  factory _$CreateAdminOidcProviderRequestDto(
          [void Function(CreateAdminOidcProviderRequestDtoBuilder)? updates]) =>
      (new CreateAdminOidcProviderRequestDtoBuilder()..update(updates))
          ._build();

  _$CreateAdminOidcProviderRequestDto._(
      {required this.providerId,
      required this.displayName,
      required this.issuer,
      required this.clientId,
      required this.clientSecret,
      required this.scopes,
      required this.enabled})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        providerId, r'CreateAdminOidcProviderRequestDto', 'providerId');
    BuiltValueNullFieldError.checkNotNull(
        displayName, r'CreateAdminOidcProviderRequestDto', 'displayName');
    BuiltValueNullFieldError.checkNotNull(
        issuer, r'CreateAdminOidcProviderRequestDto', 'issuer');
    BuiltValueNullFieldError.checkNotNull(
        clientId, r'CreateAdminOidcProviderRequestDto', 'clientId');
    BuiltValueNullFieldError.checkNotNull(
        clientSecret, r'CreateAdminOidcProviderRequestDto', 'clientSecret');
    BuiltValueNullFieldError.checkNotNull(
        scopes, r'CreateAdminOidcProviderRequestDto', 'scopes');
    BuiltValueNullFieldError.checkNotNull(
        enabled, r'CreateAdminOidcProviderRequestDto', 'enabled');
  }

  @override
  CreateAdminOidcProviderRequestDto rebuild(
          void Function(CreateAdminOidcProviderRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateAdminOidcProviderRequestDtoBuilder toBuilder() =>
      new CreateAdminOidcProviderRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateAdminOidcProviderRequestDto &&
        providerId == other.providerId &&
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
    _$hash = $jc(_$hash, providerId.hashCode);
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
    return (newBuiltValueToStringHelper(r'CreateAdminOidcProviderRequestDto')
          ..add('providerId', providerId)
          ..add('displayName', displayName)
          ..add('issuer', issuer)
          ..add('clientId', clientId)
          ..add('clientSecret', clientSecret)
          ..add('scopes', scopes)
          ..add('enabled', enabled))
        .toString();
  }
}

class CreateAdminOidcProviderRequestDtoBuilder
    implements
        Builder<CreateAdminOidcProviderRequestDto,
            CreateAdminOidcProviderRequestDtoBuilder> {
  _$CreateAdminOidcProviderRequestDto? _$v;

  String? _providerId;
  String? get providerId => _$this._providerId;
  set providerId(String? providerId) => _$this._providerId = providerId;

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

  CreateAdminOidcProviderRequestDtoBuilder() {
    CreateAdminOidcProviderRequestDto._defaults(this);
  }

  CreateAdminOidcProviderRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _providerId = $v.providerId;
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
  void replace(CreateAdminOidcProviderRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateAdminOidcProviderRequestDto;
  }

  @override
  void update(
      void Function(CreateAdminOidcProviderRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateAdminOidcProviderRequestDto build() => _build();

  _$CreateAdminOidcProviderRequestDto _build() {
    final _$result = _$v ??
        new _$CreateAdminOidcProviderRequestDto._(
            providerId: BuiltValueNullFieldError.checkNotNull(
                providerId, r'CreateAdminOidcProviderRequestDto', 'providerId'),
            displayName: BuiltValueNullFieldError.checkNotNull(
                displayName, r'CreateAdminOidcProviderRequestDto', 'displayName'),
            issuer: BuiltValueNullFieldError.checkNotNull(
                issuer, r'CreateAdminOidcProviderRequestDto', 'issuer'),
            clientId: BuiltValueNullFieldError.checkNotNull(
                clientId, r'CreateAdminOidcProviderRequestDto', 'clientId'),
            clientSecret: BuiltValueNullFieldError.checkNotNull(clientSecret,
                r'CreateAdminOidcProviderRequestDto', 'clientSecret'),
            scopes: BuiltValueNullFieldError.checkNotNull(
                scopes, r'CreateAdminOidcProviderRequestDto', 'scopes'),
            enabled: BuiltValueNullFieldError.checkNotNull(
                enabled, r'CreateAdminOidcProviderRequestDto', 'enabled'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
