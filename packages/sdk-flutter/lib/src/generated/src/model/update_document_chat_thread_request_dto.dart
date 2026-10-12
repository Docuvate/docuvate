//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_document_chat_thread_request_dto.g.dart';

/// UpdateDocumentChatThreadRequestDto
///
/// Properties:
/// * [title] 
@BuiltValue()
abstract class UpdateDocumentChatThreadRequestDto implements Built<UpdateDocumentChatThreadRequestDto, UpdateDocumentChatThreadRequestDtoBuilder> {
  @BuiltValueField(wireName: r'title')
  String get title;

  UpdateDocumentChatThreadRequestDto._();

  factory UpdateDocumentChatThreadRequestDto([void updates(UpdateDocumentChatThreadRequestDtoBuilder b)]) = _$UpdateDocumentChatThreadRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateDocumentChatThreadRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateDocumentChatThreadRequestDto> get serializer => _$UpdateDocumentChatThreadRequestDtoSerializer();
}

class _$UpdateDocumentChatThreadRequestDtoSerializer implements PrimitiveSerializer<UpdateDocumentChatThreadRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateDocumentChatThreadRequestDto, _$UpdateDocumentChatThreadRequestDto];

  @override
  final String wireName = r'UpdateDocumentChatThreadRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateDocumentChatThreadRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateDocumentChatThreadRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateDocumentChatThreadRequestDtoBuilder result,
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
  UpdateDocumentChatThreadRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateDocumentChatThreadRequestDtoBuilder();
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

