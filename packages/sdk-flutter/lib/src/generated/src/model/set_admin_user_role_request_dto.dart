//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'set_admin_user_role_request_dto.g.dart';

/// SetAdminUserRoleRequestDto
///
/// Properties:
/// * [role] 
@BuiltValue()
abstract class SetAdminUserRoleRequestDto implements Built<SetAdminUserRoleRequestDto, SetAdminUserRoleRequestDtoBuilder> {
  @BuiltValueField(wireName: r'role')
  SetAdminUserRoleRequestDtoRoleEnum get role;
  // enum roleEnum {  admin,  member,  };

  SetAdminUserRoleRequestDto._();

  factory SetAdminUserRoleRequestDto([void updates(SetAdminUserRoleRequestDtoBuilder b)]) = _$SetAdminUserRoleRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SetAdminUserRoleRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SetAdminUserRoleRequestDto> get serializer => _$SetAdminUserRoleRequestDtoSerializer();
}

class _$SetAdminUserRoleRequestDtoSerializer implements PrimitiveSerializer<SetAdminUserRoleRequestDto> {
  @override
  final Iterable<Type> types = const [SetAdminUserRoleRequestDto, _$SetAdminUserRoleRequestDto];

  @override
  final String wireName = r'SetAdminUserRoleRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SetAdminUserRoleRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(SetAdminUserRoleRequestDtoRoleEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SetAdminUserRoleRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SetAdminUserRoleRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SetAdminUserRoleRequestDtoRoleEnum),
          ) as SetAdminUserRoleRequestDtoRoleEnum;
          result.role = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SetAdminUserRoleRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SetAdminUserRoleRequestDtoBuilder();
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

class SetAdminUserRoleRequestDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'admin')
  static const SetAdminUserRoleRequestDtoRoleEnum admin = _$setAdminUserRoleRequestDtoRoleEnum_admin;
  @BuiltValueEnumConst(wireName: r'member')
  static const SetAdminUserRoleRequestDtoRoleEnum member = _$setAdminUserRoleRequestDtoRoleEnum_member;

  static Serializer<SetAdminUserRoleRequestDtoRoleEnum> get serializer => _$setAdminUserRoleRequestDtoRoleEnumSerializer;

  const SetAdminUserRoleRequestDtoRoleEnum._(String name): super(name);

  static BuiltSet<SetAdminUserRoleRequestDtoRoleEnum> get values => _$setAdminUserRoleRequestDtoRoleEnumValues;
  static SetAdminUserRoleRequestDtoRoleEnum valueOf(String name) => _$setAdminUserRoleRequestDtoRoleEnumValueOf(name);
}

