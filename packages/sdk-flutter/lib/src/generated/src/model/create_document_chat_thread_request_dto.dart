//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_document_chat_thread_request_dto.g.dart';

/// CreateDocumentChatThreadRequestDto
///
/// Properties:
/// * [title] 
@BuiltValue()
abstract class CreateDocumentChatThreadRequestDto implements Built<CreateDocumentChatThreadRequestDto, CreateDocumentChatThreadRequestDtoBuilder> {
  @BuiltValueField(wireName: r'title')
  String? get title;

  CreateDocumentChatThreadRequestDto._();

  factory CreateDocumentChatThreadRequestDto([void updates(CreateDocumentChatThreadRequestDtoBuilder b)]) = _$CreateDocumentChatThreadRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateDocumentChatThreadRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateDocumentChatThreadRequestDto> get serializer => _$CreateDocumentChatThreadRequestDtoSerializer();
}

class _$CreateDocumentChatThreadRequestDtoSerializer implements PrimitiveSerializer<CreateDocumentChatThreadRequestDto> {
  @override
  final Iterable<Type> types = const [CreateDocumentChatThreadRequestDto, _$CreateDocumentChatThreadRequestDto];

  @override
  final String wireName = r'CreateDocumentChatThreadRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateDocumentChatThreadRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateDocumentChatThreadRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateDocumentChatThreadRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateDocumentChatThreadRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateDocumentChatThreadRequestDtoBuilder();
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

