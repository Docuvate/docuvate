// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'set_admin_user_role_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const SetAdminUserRoleRequestDtoRoleEnum
    _$setAdminUserRoleRequestDtoRoleEnum_admin =
    const SetAdminUserRoleRequestDtoRoleEnum._('admin');
const SetAdminUserRoleRequestDtoRoleEnum
    _$setAdminUserRoleRequestDtoRoleEnum_member =
    const SetAdminUserRoleRequestDtoRoleEnum._('member');

SetAdminUserRoleRequestDtoRoleEnum _$setAdminUserRoleRequestDtoRoleEnumValueOf(
    String name) {
  switch (name) {
    case 'admin':
      return _$setAdminUserRoleRequestDtoRoleEnum_admin;
    case 'member':
      return _$setAdminUserRoleRequestDtoRoleEnum_member;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<SetAdminUserRoleRequestDtoRoleEnum>
    _$setAdminUserRoleRequestDtoRoleEnumValues = BuiltSet<
        SetAdminUserRoleRequestDtoRoleEnum>(const <SetAdminUserRoleRequestDtoRoleEnum>[
  _$setAdminUserRoleRequestDtoRoleEnum_admin,
  _$setAdminUserRoleRequestDtoRoleEnum_member,
]);

Serializer<SetAdminUserRoleRequestDtoRoleEnum>
    _$setAdminUserRoleRequestDtoRoleEnumSerializer =
    _$SetAdminUserRoleRequestDtoRoleEnumSerializer();

class _$SetAdminUserRoleRequestDtoRoleEnumSerializer
    implements PrimitiveSerializer<SetAdminUserRoleRequestDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'admin': 'admin',
    'member': 'member',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'admin': 'admin',
    'member': 'member',
  };

  @override
  final Iterable<Type> types = const <Type>[SetAdminUserRoleRequestDtoRoleEnum];
  @override
  final String wireName = 'SetAdminUserRoleRequestDtoRoleEnum';

  @override
  Object serialize(
          Serializers serializers, SetAdminUserRoleRequestDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  SetAdminUserRoleRequestDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      SetAdminUserRoleRequestDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$SetAdminUserRoleRequestDto extends SetAdminUserRoleRequestDto {
  @override
  final SetAdminUserRoleRequestDtoRoleEnum role;

  factory _$SetAdminUserRoleRequestDto(
          [void Function(SetAdminUserRoleRequestDtoBuilder)? updates]) =>
      (SetAdminUserRoleRequestDtoBuilder()..update(updates))._build();

  _$SetAdminUserRoleRequestDto._({required this.role}) : super._();
  @override
  SetAdminUserRoleRequestDto rebuild(
          void Function(SetAdminUserRoleRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SetAdminUserRoleRequestDtoBuilder toBuilder() =>
      SetAdminUserRoleRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SetAdminUserRoleRequestDto && role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SetAdminUserRoleRequestDto')
          ..add('role', role))
        .toString();
  }
}

class SetAdminUserRoleRequestDtoBuilder
    implements
        Builder<SetAdminUserRoleRequestDto, SetAdminUserRoleRequestDtoBuilder> {
  _$SetAdminUserRoleRequestDto? _$v;

  SetAdminUserRoleRequestDtoRoleEnum? _role;
  SetAdminUserRoleRequestDtoRoleEnum? get role => _$this._role;
  set role(SetAdminUserRoleRequestDtoRoleEnum? role) => _$this._role = role;

  SetAdminUserRoleRequestDtoBuilder() {
    SetAdminUserRoleRequestDto._defaults(this);
  }

  SetAdminUserRoleRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SetAdminUserRoleRequestDto other) {
    _$v = other as _$SetAdminUserRoleRequestDto;
  }

  @override
  void update(void Function(SetAdminUserRoleRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SetAdminUserRoleRequestDto build() => _build();

  _$SetAdminUserRoleRequestDto _build() {
    final _$result = _$v ??
        _$SetAdminUserRoleRequestDto._(
          role: BuiltValueNullFieldError.checkNotNull(
              role, r'SetAdminUserRoleRequestDto', 'role'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
