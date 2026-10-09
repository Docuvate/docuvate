//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/admin_user_response_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_user_list_response_dto.g.dart';

/// AdminUserListResponseDto
///
/// Properties:
/// * [users] 
/// * [total] 
@BuiltValue()
abstract class AdminUserListResponseDto implements Built<AdminUserListResponseDto, AdminUserListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'users')
  BuiltList<AdminUserResponseDto> get users;

  @BuiltValueField(wireName: r'total')
  num get total;

  AdminUserListResponseDto._();

  factory AdminUserListResponseDto([void updates(AdminUserListResponseDtoBuilder b)]) = _$AdminUserListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUserListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUserListResponseDto> get serializer => _$AdminUserListResponseDtoSerializer();
}

class _$AdminUserListResponseDtoSerializer implements PrimitiveSerializer<AdminUserListResponseDto> {
  @override
  final Iterable<Type> types = const [AdminUserListResponseDto, _$AdminUserListResponseDto];

  @override
  final String wireName = r'AdminUserListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUserListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'users';
    yield serializers.serialize(
      object.users,
      specifiedType: const FullType(BuiltList, [FullType(AdminUserResponseDto)]),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminUserListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminUserListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'users':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(AdminUserResponseDto)]),
          ) as BuiltList<AdminUserResponseDto>;
          result.users.replace(valueDes);
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminUserListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUserListResponseDtoBuilder();
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

