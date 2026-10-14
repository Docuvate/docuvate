// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AdminUserResponseDtoRoleEnum _$adminUserResponseDtoRoleEnum_admin =
    const AdminUserResponseDtoRoleEnum._('admin');
const AdminUserResponseDtoRoleEnum _$adminUserResponseDtoRoleEnum_member =
    const AdminUserResponseDtoRoleEnum._('member');

AdminUserResponseDtoRoleEnum _$adminUserResponseDtoRoleEnumValueOf(
    String name) {
  switch (name) {
    case 'admin':
      return _$adminUserResponseDtoRoleEnum_admin;
    case 'member':
      return _$adminUserResponseDtoRoleEnum_member;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AdminUserResponseDtoRoleEnum>
    _$adminUserResponseDtoRoleEnumValues =
    BuiltSet<AdminUserResponseDtoRoleEnum>(const <AdminUserResponseDtoRoleEnum>[
  _$adminUserResponseDtoRoleEnum_admin,
  _$adminUserResponseDtoRoleEnum_member,
]);

const AdminUserResponseDtoAccountStatusEnum
    _$adminUserResponseDtoAccountStatusEnum_active =
    const AdminUserResponseDtoAccountStatusEnum._('active');
const AdminUserResponseDtoAccountStatusEnum
    _$adminUserResponseDtoAccountStatusEnum_invited =
    const AdminUserResponseDtoAccountStatusEnum._('invited');
const AdminUserResponseDtoAccountStatusEnum
    _$adminUserResponseDtoAccountStatusEnum_suspended =
    const AdminUserResponseDtoAccountStatusEnum._('suspended');

AdminUserResponseDtoAccountStatusEnum
    _$adminUserResponseDtoAccountStatusEnumValueOf(String name) {
  switch (name) {
    case 'active':
      return _$adminUserResponseDtoAccountStatusEnum_active;
    case 'invited':
      return _$adminUserResponseDtoAccountStatusEnum_invited;
    case 'suspended':
      return _$adminUserResponseDtoAccountStatusEnum_suspended;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AdminUserResponseDtoAccountStatusEnum>
    _$adminUserResponseDtoAccountStatusEnumValues = BuiltSet<
        AdminUserResponseDtoAccountStatusEnum>(const <AdminUserResponseDtoAccountStatusEnum>[
  _$adminUserResponseDtoAccountStatusEnum_active,
  _$adminUserResponseDtoAccountStatusEnum_invited,
  _$adminUserResponseDtoAccountStatusEnum_suspended,
]);

Serializer<AdminUserResponseDtoRoleEnum>
    _$adminUserResponseDtoRoleEnumSerializer =
    _$AdminUserResponseDtoRoleEnumSerializer();
Serializer<AdminUserResponseDtoAccountStatusEnum>
    _$adminUserResponseDtoAccountStatusEnumSerializer =
    _$AdminUserResponseDtoAccountStatusEnumSerializer();

class _$AdminUserResponseDtoRoleEnumSerializer
    implements PrimitiveSerializer<AdminUserResponseDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'admin': 'admin',
    'member': 'member',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'admin': 'admin',
    'member': 'member',
  };

  @override
  final Iterable<Type> types = const <Type>[AdminUserResponseDtoRoleEnum];
  @override
  final String wireName = 'AdminUserResponseDtoRoleEnum';

  @override
  Object serialize(Serializers serializers, AdminUserResponseDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AdminUserResponseDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AdminUserResponseDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$AdminUserResponseDtoAccountStatusEnumSerializer
    implements PrimitiveSerializer<AdminUserResponseDtoAccountStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'active': 'active',
    'invited': 'invited',
    'suspended': 'suspended',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'active': 'active',
    'invited': 'invited',
    'suspended': 'suspended',
  };

  @override
  final Iterable<Type> types = const <Type>[
    AdminUserResponseDtoAccountStatusEnum
  ];
  @override
  final String wireName = 'AdminUserResponseDtoAccountStatusEnum';

  @override
  Object serialize(
          Serializers serializers, AdminUserResponseDtoAccountStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AdminUserResponseDtoAccountStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AdminUserResponseDtoAccountStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$AdminUserResponseDto extends AdminUserResponseDto {
  @override
  final String id;
  @override
  final String name;
  @override
  final String email;
  @override
  final AdminUserResponseDtoRoleEnum role;
  @override
  final bool banned;
  @override
  final String? banReason;
  @override
  final AdminUserResponseDtoAccountStatusEnum accountStatus;
  @override
  final String createdAt;

  factory _$AdminUserResponseDto(
          [void Function(AdminUserResponseDtoBuilder)? updates]) =>
      (AdminUserResponseDtoBuilder()..update(updates))._build();

  _$AdminUserResponseDto._(
      {required this.id,
      required this.name,
      required this.email,
      required this.role,
      required this.banned,
      this.banReason,
      required this.accountStatus,
      required this.createdAt})
      : super._();
  @override
  AdminUserResponseDto rebuild(
          void Function(AdminUserResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserResponseDtoBuilder toBuilder() =>
      AdminUserResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUserResponseDto &&
        id == other.id &&
        name == other.name &&
        email == other.email &&
        role == other.role &&
        banned == other.banned &&
        banReason == other.banReason &&
        accountStatus == other.accountStatus &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, banned.hashCode);
    _$hash = $jc(_$hash, banReason.hashCode);
    _$hash = $jc(_$hash, accountStatus.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminUserResponseDto')
          ..add('id', id)
          ..add('name', name)
          ..add('email', email)
          ..add('role', role)
          ..add('banned', banned)
          ..add('banReason', banReason)
          ..add('accountStatus', accountStatus)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class AdminUserResponseDtoBuilder
    implements Builder<AdminUserResponseDto, AdminUserResponseDtoBuilder> {
  _$AdminUserResponseDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  AdminUserResponseDtoRoleEnum? _role;
  AdminUserResponseDtoRoleEnum? get role => _$this._role;
  set role(AdminUserResponseDtoRoleEnum? role) => _$this._role = role;

  bool? _banned;
  bool? get banned => _$this._banned;
  set banned(bool? banned) => _$this._banned = banned;

  String? _banReason;
  String? get banReason => _$this._banReason;
  set banReason(String? banReason) => _$this._banReason = banReason;

  AdminUserResponseDtoAccountStatusEnum? _accountStatus;
  AdminUserResponseDtoAccountStatusEnum? get accountStatus =>
      _$this._accountStatus;
  set accountStatus(AdminUserResponseDtoAccountStatusEnum? accountStatus) =>
      _$this._accountStatus = accountStatus;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  AdminUserResponseDtoBuilder() {
    AdminUserResponseDto._defaults(this);
  }

  AdminUserResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _name = $v.name;
      _email = $v.email;
      _role = $v.role;
      _banned = $v.banned;
      _banReason = $v.banReason;
      _accountStatus = $v.accountStatus;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUserResponseDto other) {
    _$v = other as _$AdminUserResponseDto;
  }

  @override
  void update(void Function(AdminUserResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUserResponseDto build() => _build();

  _$AdminUserResponseDto _build() {
    final _$result = _$v ??
        _$AdminUserResponseDto._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'AdminUserResponseDto', 'id'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'AdminUserResponseDto', 'name'),
          email: BuiltValueNullFieldError.checkNotNull(
              email, r'AdminUserResponseDto', 'email'),
          role: BuiltValueNullFieldError.checkNotNull(
              role, r'AdminUserResponseDto', 'role'),
          banned: BuiltValueNullFieldError.checkNotNull(
              banned, r'AdminUserResponseDto', 'banned'),
          banReason: banReason,
          accountStatus: BuiltValueNullFieldError.checkNotNull(
              accountStatus, r'AdminUserResponseDto', 'accountStatus'),
          createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt, r'AdminUserResponseDto', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
