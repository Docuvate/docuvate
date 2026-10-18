//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/chat_message_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_request_dto.g.dart';

/// DocumentChatRequestDto
///
/// Properties:
/// * [message] 
/// * [history] 
@BuiltValue()
abstract class DocumentChatRequestDto implements Built<DocumentChatRequestDto, DocumentChatRequestDtoBuilder> {
  @BuiltValueField(wireName: r'message')
  String get message;

  @BuiltValueField(wireName: r'history')
  BuiltList<ChatMessageDto>? get history;

  DocumentChatRequestDto._();

  factory DocumentChatRequestDto([void updates(DocumentChatRequestDtoBuilder b)]) = _$DocumentChatRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatRequestDto> get serializer => _$DocumentChatRequestDtoSerializer();
}

class _$DocumentChatRequestDtoSerializer implements PrimitiveSerializer<DocumentChatRequestDto> {
  @override
  final Iterable<Type> types = const [DocumentChatRequestDto, _$DocumentChatRequestDto];

  @override
  final String wireName = r'DocumentChatRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'message';
    yield serializers.serialize(
      object.message,
      specifiedType: const FullType(String),
    );
    if (object.history != null) {
      yield r'history';
      yield serializers.serialize(
        object.history,
        specifiedType: const FullType(BuiltList, [FullType(ChatMessageDto)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'message':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.message = valueDes;
          break;
        case r'history':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ChatMessageDto)]),
          ) as BuiltList<ChatMessageDto>;
          result.history.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatRequestDtoBuilder();
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

