//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_user_invitation_request_dto.g.dart';

/// AcceptUserInvitationRequestDto
///
/// Properties:
/// * [token] 
/// * [password] 
@BuiltValue()
abstract class AcceptUserInvitationRequestDto implements Built<AcceptUserInvitationRequestDto, AcceptUserInvitationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'token')
  String get token;

  @BuiltValueField(wireName: r'password')
  String get password;

  AcceptUserInvitationRequestDto._();

  factory AcceptUserInvitationRequestDto([void updates(AcceptUserInvitationRequestDtoBuilder b)]) = _$AcceptUserInvitationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptUserInvitationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptUserInvitationRequestDto> get serializer => _$AcceptUserInvitationRequestDtoSerializer();
}

class _$AcceptUserInvitationRequestDtoSerializer implements PrimitiveSerializer<AcceptUserInvitationRequestDto> {
  @override
  final Iterable<Type> types = const [AcceptUserInvitationRequestDto, _$AcceptUserInvitationRequestDto];

  @override
  final String wireName = r'AcceptUserInvitationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptUserInvitationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptUserInvitationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AcceptUserInvitationRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptUserInvitationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptUserInvitationRequestDtoBuilder();
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

