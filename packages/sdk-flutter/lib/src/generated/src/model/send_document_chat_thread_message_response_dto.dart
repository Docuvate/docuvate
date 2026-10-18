//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/chat_message_record_dto.dart';
import 'package:docuvate/src/generated/src/model/chat_message_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'send_document_chat_thread_message_response_dto.g.dart';

/// SendDocumentChatThreadMessageResponseDto
///
/// Properties:
/// * [userMessage] 
/// * [assistantMessage] 
/// * [asyncGeneration] 
/// * [reply] 
/// * [configured] 
/// * [provider] 
/// * [setupHint] 
@BuiltValue()
abstract class SendDocumentChatThreadMessageResponseDto implements Built<SendDocumentChatThreadMessageResponseDto, SendDocumentChatThreadMessageResponseDtoBuilder> {
  @BuiltValueField(wireName: r'userMessage')
  ChatMessageRecordDto get userMessage;

  @BuiltValueField(wireName: r'assistantMessage')
  ChatMessageRecordDto get assistantMessage;

  @BuiltValueField(wireName: r'asyncGeneration')
  bool? get asyncGeneration;

  @BuiltValueField(wireName: r'reply')
  ChatMessageDto get reply;

  @BuiltValueField(wireName: r'configured')
  bool get configured;

  @BuiltValueField(wireName: r'provider')
  String? get provider;

  @BuiltValueField(wireName: r'setupHint')
  String? get setupHint;

  SendDocumentChatThreadMessageResponseDto._();

  factory SendDocumentChatThreadMessageResponseDto([void updates(SendDocumentChatThreadMessageResponseDtoBuilder b)]) = _$SendDocumentChatThreadMessageResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SendDocumentChatThreadMessageResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SendDocumentChatThreadMessageResponseDto> get serializer => _$SendDocumentChatThreadMessageResponseDtoSerializer();
}

class _$SendDocumentChatThreadMessageResponseDtoSerializer implements PrimitiveSerializer<SendDocumentChatThreadMessageResponseDto> {
  @override
  final Iterable<Type> types = const [SendDocumentChatThreadMessageResponseDto, _$SendDocumentChatThreadMessageResponseDto];

  @override
  final String wireName = r'SendDocumentChatThreadMessageResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SendDocumentChatThreadMessageResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'userMessage';
    yield serializers.serialize(
      object.userMessage,
      specifiedType: const FullType(ChatMessageRecordDto),
    );
    yield r'assistantMessage';
    yield serializers.serialize(
      object.assistantMessage,
      specifiedType: const FullType(ChatMessageRecordDto),
    );
    if (object.asyncGeneration != null) {
      yield r'asyncGeneration';
      yield serializers.serialize(
        object.asyncGeneration,
        specifiedType: const FullType(bool),
      );
    }
    yield r'reply';
    yield serializers.serialize(
      object.reply,
      specifiedType: const FullType(ChatMessageDto),
    );
    yield r'configured';
    yield serializers.serialize(
      object.configured,
      specifiedType: const FullType(bool),
    );
    if (object.provider != null) {
      yield r'provider';
      yield serializers.serialize(
        object.provider,
        specifiedType: const FullType(String),
      );
    }
    if (object.setupHint != null) {
      yield r'setupHint';
      yield serializers.serialize(
        object.setupHint,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    SendDocumentChatThreadMessageResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SendDocumentChatThreadMessageResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'userMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageRecordDto),
          ) as ChatMessageRecordDto;
          result.userMessage.replace(valueDes);
          break;
        case r'assistantMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageRecordDto),
          ) as ChatMessageRecordDto;
          result.assistantMessage.replace(valueDes);
          break;
        case r'asyncGeneration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.asyncGeneration = valueDes;
          break;
        case r'reply':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageDto),
          ) as ChatMessageDto;
          result.reply.replace(valueDes);
          break;
        case r'configured':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.configured = valueDes;
          break;
        case r'provider':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.provider = valueDes;
          break;
        case r'setupHint':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.setupHint = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SendDocumentChatThreadMessageResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SendDocumentChatThreadMessageResponseDtoBuilder();
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

