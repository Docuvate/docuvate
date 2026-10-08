//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_chat_thread_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_thread_list_response_dto.g.dart';

/// DocumentChatThreadListResponseDto
///
/// Properties:
/// * [threads] 
@BuiltValue()
abstract class DocumentChatThreadListResponseDto implements Built<DocumentChatThreadListResponseDto, DocumentChatThreadListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'threads')
  BuiltList<DocumentChatThreadDto> get threads;

  DocumentChatThreadListResponseDto._();

  factory DocumentChatThreadListResponseDto([void updates(DocumentChatThreadListResponseDtoBuilder b)]) = _$DocumentChatThreadListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatThreadListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatThreadListResponseDto> get serializer => _$DocumentChatThreadListResponseDtoSerializer();
}

class _$DocumentChatThreadListResponseDtoSerializer implements PrimitiveSerializer<DocumentChatThreadListResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentChatThreadListResponseDto, _$DocumentChatThreadListResponseDto];

  @override
  final String wireName = r'DocumentChatThreadListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatThreadListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'threads';
    yield serializers.serialize(
      object.threads,
      specifiedType: const FullType(BuiltList, [FullType(DocumentChatThreadDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatThreadListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatThreadListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'threads':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentChatThreadDto)]),
          ) as BuiltList<DocumentChatThreadDto>;
          result.threads.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatThreadListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatThreadListResponseDtoBuilder();
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

