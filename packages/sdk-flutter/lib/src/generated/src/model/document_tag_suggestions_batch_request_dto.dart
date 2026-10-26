//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_tag_suggestions_batch_request_dto.g.dart';

/// DocumentTagSuggestionsBatchRequestDto
///
/// Properties:
/// * [documentIds] 
@BuiltValue()
abstract class DocumentTagSuggestionsBatchRequestDto implements Built<DocumentTagSuggestionsBatchRequestDto, DocumentTagSuggestionsBatchRequestDtoBuilder> {
  @BuiltValueField(wireName: r'documentIds')
  BuiltList<String> get documentIds;

  DocumentTagSuggestionsBatchRequestDto._();

  factory DocumentTagSuggestionsBatchRequestDto([void updates(DocumentTagSuggestionsBatchRequestDtoBuilder b)]) = _$DocumentTagSuggestionsBatchRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentTagSuggestionsBatchRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentTagSuggestionsBatchRequestDto> get serializer => _$DocumentTagSuggestionsBatchRequestDtoSerializer();
}

class _$DocumentTagSuggestionsBatchRequestDtoSerializer implements PrimitiveSerializer<DocumentTagSuggestionsBatchRequestDto> {
  @override
  final Iterable<Type> types = const [DocumentTagSuggestionsBatchRequestDto, _$DocumentTagSuggestionsBatchRequestDto];

  @override
  final String wireName = r'DocumentTagSuggestionsBatchRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentTagSuggestionsBatchRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentIds';
    yield serializers.serialize(
      object.documentIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentTagSuggestionsBatchRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentTagSuggestionsBatchRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.documentIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentTagSuggestionsBatchRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentTagSuggestionsBatchRequestDtoBuilder();
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

