// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invite_admin_user_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const InviteAdminUserRequestDtoRoleEnum
    _$inviteAdminUserRequestDtoRoleEnum_admin =
    const InviteAdminUserRequestDtoRoleEnum._('admin');
const InviteAdminUserRequestDtoRoleEnum
    _$inviteAdminUserRequestDtoRoleEnum_member =
    const InviteAdminUserRequestDtoRoleEnum._('member');

InviteAdminUserRequestDtoRoleEnum _$inviteAdminUserRequestDtoRoleEnumValueOf(
    String name) {
  switch (name) {
    case 'admin':
      return _$inviteAdminUserRequestDtoRoleEnum_admin;
    case 'member':
      return _$inviteAdminUserRequestDtoRoleEnum_member;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<InviteAdminUserRequestDtoRoleEnum>
    _$inviteAdminUserRequestDtoRoleEnumValues = BuiltSet<
        InviteAdminUserRequestDtoRoleEnum>(const <InviteAdminUserRequestDtoRoleEnum>[
  _$inviteAdminUserRequestDtoRoleEnum_admin,
  _$inviteAdminUserRequestDtoRoleEnum_member,
]);

Serializer<InviteAdminUserRequestDtoRoleEnum>
    _$inviteAdminUserRequestDtoRoleEnumSerializer =
    _$InviteAdminUserRequestDtoRoleEnumSerializer();

class _$InviteAdminUserRequestDtoRoleEnumSerializer
    implements PrimitiveSerializer<InviteAdminUserRequestDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'admin': 'admin',
    'member': 'member',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'admin': 'admin',
    'member': 'member',
  };

  @override
  final Iterable<Type> types = const <Type>[InviteAdminUserRequestDtoRoleEnum];
  @override
  final String wireName = 'InviteAdminUserRequestDtoRoleEnum';

  @override
  Object serialize(
          Serializers serializers, InviteAdminUserRequestDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  InviteAdminUserRequestDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      InviteAdminUserRequestDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$InviteAdminUserRequestDto extends InviteAdminUserRequestDto {
  @override
  final String email;
  @override
  final String name;
  @override
  final InviteAdminUserRequestDtoRoleEnum? role;

  factory _$InviteAdminUserRequestDto(
          [void Function(InviteAdminUserRequestDtoBuilder)? updates]) =>
      (InviteAdminUserRequestDtoBuilder()..update(updates))._build();

  _$InviteAdminUserRequestDto._(
      {required this.email, required this.name, this.role})
      : super._();
  @override
  InviteAdminUserRequestDto rebuild(
          void Function(InviteAdminUserRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  InviteAdminUserRequestDtoBuilder toBuilder() =>
      InviteAdminUserRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InviteAdminUserRequestDto &&
        email == other.email &&
        name == other.name &&
        role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InviteAdminUserRequestDto')
          ..add('email', email)
          ..add('name', name)
          ..add('role', role))
        .toString();
  }
}

class InviteAdminUserRequestDtoBuilder
    implements
        Builder<InviteAdminUserRequestDto, InviteAdminUserRequestDtoBuilder> {
  _$InviteAdminUserRequestDto? _$v;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  InviteAdminUserRequestDtoRoleEnum? _role;
  InviteAdminUserRequestDtoRoleEnum? get role => _$this._role;
  set role(InviteAdminUserRequestDtoRoleEnum? role) => _$this._role = role;

  InviteAdminUserRequestDtoBuilder() {
    InviteAdminUserRequestDto._defaults(this);
  }

  InviteAdminUserRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _email = $v.email;
      _name = $v.name;
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InviteAdminUserRequestDto other) {
    _$v = other as _$InviteAdminUserRequestDto;
  }

  @override
  void update(void Function(InviteAdminUserRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InviteAdminUserRequestDto build() => _build();

  _$InviteAdminUserRequestDto _build() {
    final _$result = _$v ??
        _$InviteAdminUserRequestDto._(
          email: BuiltValueNullFieldError.checkNotNull(
              email, r'InviteAdminUserRequestDto', 'email'),
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'InviteAdminUserRequestDto', 'name'),
          role: role,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
