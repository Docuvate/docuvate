//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/chat_message_record_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_thread_messages_response_dto.g.dart';

/// DocumentChatThreadMessagesResponseDto
///
/// Properties:
/// * [messages] 
@BuiltValue()
abstract class DocumentChatThreadMessagesResponseDto implements Built<DocumentChatThreadMessagesResponseDto, DocumentChatThreadMessagesResponseDtoBuilder> {
  @BuiltValueField(wireName: r'messages')
  BuiltList<ChatMessageRecordDto> get messages;

  DocumentChatThreadMessagesResponseDto._();

  factory DocumentChatThreadMessagesResponseDto([void updates(DocumentChatThreadMessagesResponseDtoBuilder b)]) = _$DocumentChatThreadMessagesResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatThreadMessagesResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatThreadMessagesResponseDto> get serializer => _$DocumentChatThreadMessagesResponseDtoSerializer();
}

class _$DocumentChatThreadMessagesResponseDtoSerializer implements PrimitiveSerializer<DocumentChatThreadMessagesResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentChatThreadMessagesResponseDto, _$DocumentChatThreadMessagesResponseDto];

  @override
  final String wireName = r'DocumentChatThreadMessagesResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatThreadMessagesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'messages';
    yield serializers.serialize(
      object.messages,
      specifiedType: const FullType(BuiltList, [FullType(ChatMessageRecordDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatThreadMessagesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatThreadMessagesResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'messages':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ChatMessageRecordDto)]),
          ) as BuiltList<ChatMessageRecordDto>;
          result.messages.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatThreadMessagesResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatThreadMessagesResponseDtoBuilder();
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

