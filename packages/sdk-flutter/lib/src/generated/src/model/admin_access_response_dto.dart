//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_access_response_dto.g.dart';

/// AdminAccessResponseDto
///
/// Properties:
/// * [isAdministrator] 
/// * [role] 
/// * [roleDescriptions] 
@BuiltValue()
abstract class AdminAccessResponseDto implements Built<AdminAccessResponseDto, AdminAccessResponseDtoBuilder> {
  @BuiltValueField(wireName: r'isAdministrator')
  bool get isAdministrator;

  @BuiltValueField(wireName: r'role')
  AdminAccessResponseDtoRoleEnum get role;
  // enum roleEnum {  admin,  member,  };

  @BuiltValueField(wireName: r'roleDescriptions')
  BuiltList<JsonObject> get roleDescriptions;

  AdminAccessResponseDto._();

  factory AdminAccessResponseDto([void updates(AdminAccessResponseDtoBuilder b)]) = _$AdminAccessResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminAccessResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminAccessResponseDto> get serializer => _$AdminAccessResponseDtoSerializer();
}

class _$AdminAccessResponseDtoSerializer implements PrimitiveSerializer<AdminAccessResponseDto> {
  @override
  final Iterable<Type> types = const [AdminAccessResponseDto, _$AdminAccessResponseDto];

  @override
  final String wireName = r'AdminAccessResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminAccessResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'isAdministrator';
    yield serializers.serialize(
      object.isAdministrator,
      specifiedType: const FullType(bool),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(AdminAccessResponseDtoRoleEnum),
    );
    yield r'roleDescriptions';
    yield serializers.serialize(
      object.roleDescriptions,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminAccessResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminAccessResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'isAdministrator':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isAdministrator = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AdminAccessResponseDtoRoleEnum),
          ) as AdminAccessResponseDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'roleDescriptions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.roleDescriptions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminAccessResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminAccessResponseDtoBuilder();
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

class AdminAccessResponseDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'admin')
  static const AdminAccessResponseDtoRoleEnum admin = _$adminAccessResponseDtoRoleEnum_admin;
  @BuiltValueEnumConst(wireName: r'member')
  static const AdminAccessResponseDtoRoleEnum member = _$adminAccessResponseDtoRoleEnum_member;

  static Serializer<AdminAccessResponseDtoRoleEnum> get serializer => _$adminAccessResponseDtoRoleEnumSerializer;

  const AdminAccessResponseDtoRoleEnum._(String name): super(name);

  static BuiltSet<AdminAccessResponseDtoRoleEnum> get values => _$adminAccessResponseDtoRoleEnumValues;
  static AdminAccessResponseDtoRoleEnum valueOf(String name) => _$adminAccessResponseDtoRoleEnumValueOf(name);
}

