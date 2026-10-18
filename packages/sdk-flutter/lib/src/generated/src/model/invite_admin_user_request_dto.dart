//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'invite_admin_user_request_dto.g.dart';

/// InviteAdminUserRequestDto
///
/// Properties:
/// * [email] 
/// * [name] 
/// * [role] 
@BuiltValue()
abstract class InviteAdminUserRequestDto implements Built<InviteAdminUserRequestDto, InviteAdminUserRequestDtoBuilder> {
  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'role')
  InviteAdminUserRequestDtoRoleEnum? get role;
  // enum roleEnum {  admin,  member,  };

  InviteAdminUserRequestDto._();

  factory InviteAdminUserRequestDto([void updates(InviteAdminUserRequestDtoBuilder b)]) = _$InviteAdminUserRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(InviteAdminUserRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<InviteAdminUserRequestDto> get serializer => _$InviteAdminUserRequestDtoSerializer();
}

class _$InviteAdminUserRequestDtoSerializer implements PrimitiveSerializer<InviteAdminUserRequestDto> {
  @override
  final Iterable<Type> types = const [InviteAdminUserRequestDto, _$InviteAdminUserRequestDto];

  @override
  final String wireName = r'InviteAdminUserRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    InviteAdminUserRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.role != null) {
      yield r'role';
      yield serializers.serialize(
        object.role,
        specifiedType: const FullType(InviteAdminUserRequestDtoRoleEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    InviteAdminUserRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required InviteAdminUserRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(InviteAdminUserRequestDtoRoleEnum),
          ) as InviteAdminUserRequestDtoRoleEnum;
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
  InviteAdminUserRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = InviteAdminUserRequestDtoBuilder();
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

class InviteAdminUserRequestDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'admin')
  static const InviteAdminUserRequestDtoRoleEnum admin = _$inviteAdminUserRequestDtoRoleEnum_admin;
  @BuiltValueEnumConst(wireName: r'member')
  static const InviteAdminUserRequestDtoRoleEnum member = _$inviteAdminUserRequestDtoRoleEnum_member;

  static Serializer<InviteAdminUserRequestDtoRoleEnum> get serializer => _$inviteAdminUserRequestDtoRoleEnumSerializer;

  const InviteAdminUserRequestDtoRoleEnum._(String name): super(name);

  static BuiltSet<InviteAdminUserRequestDtoRoleEnum> get values => _$inviteAdminUserRequestDtoRoleEnumValues;
  static InviteAdminUserRequestDtoRoleEnum valueOf(String name) => _$inviteAdminUserRequestDtoRoleEnumValueOf(name);
}

