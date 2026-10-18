//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'chat_message_dto.g.dart';

/// ChatMessageDto
///
/// Properties:
/// * [role] 
/// * [content] 
@BuiltValue()
abstract class ChatMessageDto implements Built<ChatMessageDto, ChatMessageDtoBuilder> {
  @BuiltValueField(wireName: r'role')
  ChatMessageDtoRoleEnum get role;
  // enum roleEnum {  user,  assistant,  };

  @BuiltValueField(wireName: r'content')
  String get content;

  ChatMessageDto._();

  factory ChatMessageDto([void updates(ChatMessageDtoBuilder b)]) = _$ChatMessageDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ChatMessageDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ChatMessageDto> get serializer => _$ChatMessageDtoSerializer();
}

class _$ChatMessageDtoSerializer implements PrimitiveSerializer<ChatMessageDto> {
  @override
  final Iterable<Type> types = const [ChatMessageDto, _$ChatMessageDto];

  @override
  final String wireName = r'ChatMessageDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ChatMessageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(ChatMessageDtoRoleEnum),
    );
    yield r'content';
    yield serializers.serialize(
      object.content,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ChatMessageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ChatMessageDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageDtoRoleEnum),
          ) as ChatMessageDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.content = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ChatMessageDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ChatMessageDtoBuilder();
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

class ChatMessageDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'user')
  static const ChatMessageDtoRoleEnum user = _$chatMessageDtoRoleEnum_user;
  @BuiltValueEnumConst(wireName: r'assistant')
  static const ChatMessageDtoRoleEnum assistant = _$chatMessageDtoRoleEnum_assistant;

  static Serializer<ChatMessageDtoRoleEnum> get serializer => _$chatMessageDtoRoleEnumSerializer;

  const ChatMessageDtoRoleEnum._(String name): super(name);

  static BuiltSet<ChatMessageDtoRoleEnum> get values => _$chatMessageDtoRoleEnumValues;
  static ChatMessageDtoRoleEnum valueOf(String name) => _$chatMessageDtoRoleEnumValueOf(name);
}

