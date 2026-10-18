// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_oidc_provider_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AdminOidcProviderResponseDtoSource_Enum
    _$adminOidcProviderResponseDtoSourceEnum_admin =
    const AdminOidcProviderResponseDtoSource_Enum._('admin');
const AdminOidcProviderResponseDtoSource_Enum
    _$adminOidcProviderResponseDtoSourceEnum_env =
    const AdminOidcProviderResponseDtoSource_Enum._('env');

AdminOidcProviderResponseDtoSource_Enum
    _$adminOidcProviderResponseDtoSourceEnumValueOf(String name) {
  switch (name) {
    case 'admin':
      return _$adminOidcProviderResponseDtoSourceEnum_admin;
    case 'env':
      return _$adminOidcProviderResponseDtoSourceEnum_env;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<AdminOidcProviderResponseDtoSource_Enum>
    _$adminOidcProviderResponseDtoSourceEnumValues = new BuiltSet<
        AdminOidcProviderResponseDtoSource_Enum>(const <AdminOidcProviderResponseDtoSource_Enum>[
  _$adminOidcProviderResponseDtoSourceEnum_admin,
  _$adminOidcProviderResponseDtoSourceEnum_env,
]);

Serializer<AdminOidcProviderResponseDtoSource_Enum>
    _$adminOidcProviderResponseDtoSourceEnumSerializer =
    new _$AdminOidcProviderResponseDtoSource_EnumSerializer();

class _$AdminOidcProviderResponseDtoSource_EnumSerializer
    implements PrimitiveSerializer<AdminOidcProviderResponseDtoSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'admin': 'admin',
    'env': 'env',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'admin': 'admin',
    'env': 'env',
  };

  @override
  final Iterable<Type> types = const <Type>[
    AdminOidcProviderResponseDtoSource_Enum
  ];
  @override
  final String wireName = 'AdminOidcProviderResponseDtoSource_Enum';

  @override
  Object serialize(Serializers serializers,
          AdminOidcProviderResponseDtoSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AdminOidcProviderResponseDtoSource_Enum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AdminOidcProviderResponseDtoSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$AdminOidcProviderResponseDto extends AdminOidcProviderResponseDto {
  @override
  final String id;
  @override
  final String providerId;
  @override
  final String displayName;
  @override
  final String issuer;
  @override
  final String clientId;
  @override
  final String scopes;
  @override
  final bool enabled;
  @override
  final AdminOidcProviderResponseDtoSource_Enum source_;
  @override
  final bool hasClientSecret;

  factory _$AdminOidcProviderResponseDto(
          [void Function(AdminOidcProviderResponseDtoBuilder)? updates]) =>
      (new AdminOidcProviderResponseDtoBuilder()..update(updates))._build();

  _$AdminOidcProviderResponseDto._(
      {required this.id,
      required this.providerId,
      required this.displayName,
      required this.issuer,
      required this.clientId,
      required this.scopes,
      required this.enabled,
      required this.source_,
      required this.hasClientSecret})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'AdminOidcProviderResponseDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        providerId, r'AdminOidcProviderResponseDto', 'providerId');
    BuiltValueNullFieldError.checkNotNull(
        displayName, r'AdminOidcProviderResponseDto', 'displayName');
    BuiltValueNullFieldError.checkNotNull(
        issuer, r'AdminOidcProviderResponseDto', 'issuer');
    BuiltValueNullFieldError.checkNotNull(
        clientId, r'AdminOidcProviderResponseDto', 'clientId');
    BuiltValueNullFieldError.checkNotNull(
        scopes, r'AdminOidcProviderResponseDto', 'scopes');
    BuiltValueNullFieldError.checkNotNull(
        enabled, r'AdminOidcProviderResponseDto', 'enabled');
    BuiltValueNullFieldError.checkNotNull(
        source_, r'AdminOidcProviderResponseDto', 'source_');
    BuiltValueNullFieldError.checkNotNull(
        hasClientSecret, r'AdminOidcProviderResponseDto', 'hasClientSecret');
  }

  @override
  AdminOidcProviderResponseDto rebuild(
          void Function(AdminOidcProviderResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminOidcProviderResponseDtoBuilder toBuilder() =>
      new AdminOidcProviderResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminOidcProviderResponseDto &&
        id == other.id &&
        providerId == other.providerId &&
        displayName == other.displayName &&
        issuer == other.issuer &&
        clientId == other.clientId &&
        scopes == other.scopes &&
        enabled == other.enabled &&
        source_ == other.source_ &&
        hasClientSecret == other.hasClientSecret;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, providerId.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, issuer.hashCode);
    _$hash = $jc(_$hash, clientId.hashCode);
    _$hash = $jc(_$hash, scopes.hashCode);
    _$hash = $jc(_$hash, enabled.hashCode);
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, hasClientSecret.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminOidcProviderResponseDto')
          ..add('id', id)
          ..add('providerId', providerId)
          ..add('displayName', displayName)
          ..add('issuer', issuer)
          ..add('clientId', clientId)
          ..add('scopes', scopes)
          ..add('enabled', enabled)
          ..add('source_', source_)
          ..add('hasClientSecret', hasClientSecret))
        .toString();
  }
}

class AdminOidcProviderResponseDtoBuilder
    implements
        Builder<AdminOidcProviderResponseDto,
            AdminOidcProviderResponseDtoBuilder> {
  _$AdminOidcProviderResponseDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

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

  String? _scopes;
  String? get scopes => _$this._scopes;
  set scopes(String? scopes) => _$this._scopes = scopes;

  bool? _enabled;
  bool? get enabled => _$this._enabled;
  set enabled(bool? enabled) => _$this._enabled = enabled;

  AdminOidcProviderResponseDtoSource_Enum? _source_;
  AdminOidcProviderResponseDtoSource_Enum? get source_ => _$this._source_;
  set source_(AdminOidcProviderResponseDtoSource_Enum? source_) =>
      _$this._source_ = source_;

  bool? _hasClientSecret;
  bool? get hasClientSecret => _$this._hasClientSecret;
  set hasClientSecret(bool? hasClientSecret) =>
      _$this._hasClientSecret = hasClientSecret;

  AdminOidcProviderResponseDtoBuilder() {
    AdminOidcProviderResponseDto._defaults(this);
  }

  AdminOidcProviderResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _providerId = $v.providerId;
      _displayName = $v.displayName;
      _issuer = $v.issuer;
      _clientId = $v.clientId;
      _scopes = $v.scopes;
      _enabled = $v.enabled;
      _source_ = $v.source_;
      _hasClientSecret = $v.hasClientSecret;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminOidcProviderResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AdminOidcProviderResponseDto;
  }

  @override
  void update(void Function(AdminOidcProviderResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminOidcProviderResponseDto build() => _build();

  _$AdminOidcProviderResponseDto _build() {
    final _$result = _$v ??
        new _$AdminOidcProviderResponseDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'AdminOidcProviderResponseDto', 'id'),
            providerId: BuiltValueNullFieldError.checkNotNull(
                providerId, r'AdminOidcProviderResponseDto', 'providerId'),
            displayName: BuiltValueNullFieldError.checkNotNull(
                displayName, r'AdminOidcProviderResponseDto', 'displayName'),
            issuer: BuiltValueNullFieldError.checkNotNull(
                issuer, r'AdminOidcProviderResponseDto', 'issuer'),
            clientId: BuiltValueNullFieldError.checkNotNull(
                clientId, r'AdminOidcProviderResponseDto', 'clientId'),
            scopes: BuiltValueNullFieldError.checkNotNull(
                scopes, r'AdminOidcProviderResponseDto', 'scopes'),
            enabled: BuiltValueNullFieldError.checkNotNull(
                enabled, r'AdminOidcProviderResponseDto', 'enabled'),
            source_: BuiltValueNullFieldError.checkNotNull(
                source_, r'AdminOidcProviderResponseDto', 'source_'),
            hasClientSecret: BuiltValueNullFieldError.checkNotNull(hasClientSecret, r'AdminOidcProviderResponseDto', 'hasClientSecret'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
