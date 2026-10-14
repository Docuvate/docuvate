// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_access_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AdminAccessResponseDtoRoleEnum _$adminAccessResponseDtoRoleEnum_admin =
    const AdminAccessResponseDtoRoleEnum._('admin');
const AdminAccessResponseDtoRoleEnum _$adminAccessResponseDtoRoleEnum_member =
    const AdminAccessResponseDtoRoleEnum._('member');

AdminAccessResponseDtoRoleEnum _$adminAccessResponseDtoRoleEnumValueOf(
    String name) {
  switch (name) {
    case 'admin':
      return _$adminAccessResponseDtoRoleEnum_admin;
    case 'member':
      return _$adminAccessResponseDtoRoleEnum_member;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AdminAccessResponseDtoRoleEnum>
    _$adminAccessResponseDtoRoleEnumValues = BuiltSet<
        AdminAccessResponseDtoRoleEnum>(const <AdminAccessResponseDtoRoleEnum>[
  _$adminAccessResponseDtoRoleEnum_admin,
  _$adminAccessResponseDtoRoleEnum_member,
]);

Serializer<AdminAccessResponseDtoRoleEnum>
    _$adminAccessResponseDtoRoleEnumSerializer =
    _$AdminAccessResponseDtoRoleEnumSerializer();

class _$AdminAccessResponseDtoRoleEnumSerializer
    implements PrimitiveSerializer<AdminAccessResponseDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'admin': 'admin',
    'member': 'member',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'admin': 'admin',
    'member': 'member',
  };

  @override
  final Iterable<Type> types = const <Type>[AdminAccessResponseDtoRoleEnum];
  @override
  final String wireName = 'AdminAccessResponseDtoRoleEnum';

  @override
  Object serialize(
          Serializers serializers, AdminAccessResponseDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  AdminAccessResponseDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      AdminAccessResponseDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$AdminAccessResponseDto extends AdminAccessResponseDto {
  @override
  final bool isAdministrator;
  @override
  final AdminAccessResponseDtoRoleEnum role;
  @override
  final BuiltList<JsonObject> roleDescriptions;

  factory _$AdminAccessResponseDto(
          [void Function(AdminAccessResponseDtoBuilder)? updates]) =>
      (AdminAccessResponseDtoBuilder()..update(updates))._build();

  _$AdminAccessResponseDto._(
      {required this.isAdministrator,
      required this.role,
      required this.roleDescriptions})
      : super._();
  @override
  AdminAccessResponseDto rebuild(
          void Function(AdminAccessResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminAccessResponseDtoBuilder toBuilder() =>
      AdminAccessResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminAccessResponseDto &&
        isAdministrator == other.isAdministrator &&
        role == other.role &&
        roleDescriptions == other.roleDescriptions;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, isAdministrator.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, roleDescriptions.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminAccessResponseDto')
          ..add('isAdministrator', isAdministrator)
          ..add('role', role)
          ..add('roleDescriptions', roleDescriptions))
        .toString();
  }
}

class AdminAccessResponseDtoBuilder
    implements Builder<AdminAccessResponseDto, AdminAccessResponseDtoBuilder> {
  _$AdminAccessResponseDto? _$v;

  bool? _isAdministrator;
  bool? get isAdministrator => _$this._isAdministrator;
  set isAdministrator(bool? isAdministrator) =>
      _$this._isAdministrator = isAdministrator;

  AdminAccessResponseDtoRoleEnum? _role;
  AdminAccessResponseDtoRoleEnum? get role => _$this._role;
  set role(AdminAccessResponseDtoRoleEnum? role) => _$this._role = role;

  ListBuilder<JsonObject>? _roleDescriptions;
  ListBuilder<JsonObject> get roleDescriptions =>
      _$this._roleDescriptions ??= ListBuilder<JsonObject>();
  set roleDescriptions(ListBuilder<JsonObject>? roleDescriptions) =>
      _$this._roleDescriptions = roleDescriptions;

  AdminAccessResponseDtoBuilder() {
    AdminAccessResponseDto._defaults(this);
  }

  AdminAccessResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _isAdministrator = $v.isAdministrator;
      _role = $v.role;
      _roleDescriptions = $v.roleDescriptions.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminAccessResponseDto other) {
    _$v = other as _$AdminAccessResponseDto;
  }

  @override
  void update(void Function(AdminAccessResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminAccessResponseDto build() => _build();

  _$AdminAccessResponseDto _build() {
    _$AdminAccessResponseDto _$result;
    try {
      _$result = _$v ??
          _$AdminAccessResponseDto._(
            isAdministrator: BuiltValueNullFieldError.checkNotNull(
                isAdministrator, r'AdminAccessResponseDto', 'isAdministrator'),
            role: BuiltValueNullFieldError.checkNotNull(
                role, r'AdminAccessResponseDto', 'role'),
            roleDescriptions: roleDescriptions.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'roleDescriptions';
        roleDescriptions.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'AdminAccessResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
