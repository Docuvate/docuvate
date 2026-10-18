//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_user_response_dto.g.dart';

/// AdminUserResponseDto
///
/// Properties:
/// * [id] 
/// * [name] 
/// * [email] 
/// * [role] 
/// * [banned] 
/// * [banReason] 
/// * [accountStatus] 
/// * [createdAt] 
@BuiltValue()
abstract class AdminUserResponseDto implements Built<AdminUserResponseDto, AdminUserResponseDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'role')
  AdminUserResponseDtoRoleEnum get role;
  // enum roleEnum {  admin,  member,  };

  @BuiltValueField(wireName: r'banned')
  bool get banned;

  @BuiltValueField(wireName: r'banReason')
  String? get banReason;

  @BuiltValueField(wireName: r'accountStatus')
  AdminUserResponseDtoAccountStatusEnum get accountStatus;
  // enum accountStatusEnum {  active,  invited,  suspended,  };

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  AdminUserResponseDto._();

  factory AdminUserResponseDto([void updates(AdminUserResponseDtoBuilder b)]) = _$AdminUserResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUserResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUserResponseDto> get serializer => _$AdminUserResponseDtoSerializer();
}

class _$AdminUserResponseDtoSerializer implements PrimitiveSerializer<AdminUserResponseDto> {
  @override
  final Iterable<Type> types = const [AdminUserResponseDto, _$AdminUserResponseDto];

  @override
  final String wireName = r'AdminUserResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUserResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(AdminUserResponseDtoRoleEnum),
    );
    yield r'banned';
    yield serializers.serialize(
      object.banned,
      specifiedType: const FullType(bool),
    );
    if (object.banReason != null) {
      yield r'banReason';
      yield serializers.serialize(
        object.banReason,
        specifiedType: const FullType(String),
      );
    }
    yield r'accountStatus';
    yield serializers.serialize(
      object.accountStatus,
      specifiedType: const FullType(AdminUserResponseDtoAccountStatusEnum),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminUserResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminUserResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AdminUserResponseDtoRoleEnum),
          ) as AdminUserResponseDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'banned':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.banned = valueDes;
          break;
        case r'banReason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.banReason = valueDes;
          break;
        case r'accountStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AdminUserResponseDtoAccountStatusEnum),
          ) as AdminUserResponseDtoAccountStatusEnum;
          result.accountStatus = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminUserResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUserResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class AdminUserResponseDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'admin')
  static const AdminUserResponseDtoRoleEnum admin = _$adminUserResponseDtoRoleEnum_admin;
  @BuiltValueEnumConst(wireName: r'member')
  static const AdminUserResponseDtoRoleEnum member = _$adminUserResponseDtoRoleEnum_member;

  static Serializer<AdminUserResponseDtoRoleEnum> get serializer => _$adminUserResponseDtoRoleEnumSerializer;

  const AdminUserResponseDtoRoleEnum._(String name): super(name);

  static BuiltSet<AdminUserResponseDtoRoleEnum> get values => _$adminUserResponseDtoRoleEnumValues;
  static AdminUserResponseDtoRoleEnum valueOf(String name) => _$adminUserResponseDtoRoleEnumValueOf(name);
}

class AdminUserResponseDtoAccountStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'active')
  static const AdminUserResponseDtoAccountStatusEnum active = _$adminUserResponseDtoAccountStatusEnum_active;
  @BuiltValueEnumConst(wireName: r'invited')
  static const AdminUserResponseDtoAccountStatusEnum invited = _$adminUserResponseDtoAccountStatusEnum_invited;
  @BuiltValueEnumConst(wireName: r'suspended')
  static const AdminUserResponseDtoAccountStatusEnum suspended = _$adminUserResponseDtoAccountStatusEnum_suspended;

  static Serializer<AdminUserResponseDtoAccountStatusEnum> get serializer => _$adminUserResponseDtoAccountStatusEnumSerializer;

  const AdminUserResponseDtoAccountStatusEnum._(String name): super(name);

  static BuiltSet<AdminUserResponseDtoAccountStatusEnum> get values => _$adminUserResponseDtoAccountStatusEnumValues;
  static AdminUserResponseDtoAccountStatusEnum valueOf(String name) => _$adminUserResponseDtoAccountStatusEnumValueOf(name);
}

