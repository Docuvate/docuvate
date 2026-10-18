//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/chat_message_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_response_dto.g.dart';

/// DocumentChatResponseDto
///
/// Properties:
/// * [reply] 
/// * [configured] 
/// * [provider] 
/// * [setupHint] 
@BuiltValue()
abstract class DocumentChatResponseDto implements Built<DocumentChatResponseDto, DocumentChatResponseDtoBuilder> {
  @BuiltValueField(wireName: r'reply')
  ChatMessageDto get reply;

  @BuiltValueField(wireName: r'configured')
  bool get configured;

  @BuiltValueField(wireName: r'provider')
  String? get provider;

  @BuiltValueField(wireName: r'setupHint')
  String? get setupHint;

  DocumentChatResponseDto._();

  factory DocumentChatResponseDto([void updates(DocumentChatResponseDtoBuilder b)]) = _$DocumentChatResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatResponseDto> get serializer => _$DocumentChatResponseDtoSerializer();
}

class _$DocumentChatResponseDtoSerializer implements PrimitiveSerializer<DocumentChatResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentChatResponseDto, _$DocumentChatResponseDto];

  @override
  final String wireName = r'DocumentChatResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    DocumentChatResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
  DocumentChatResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatResponseDtoBuilder();
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

