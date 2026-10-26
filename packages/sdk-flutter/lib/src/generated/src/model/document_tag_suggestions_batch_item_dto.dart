//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_tag_suggestions_batch_item_dto.g.dart';

/// DocumentTagSuggestionsBatchItemDto
///
/// Properties:
/// * [documentId] 
/// * [suggestions] 
@BuiltValue()
abstract class DocumentTagSuggestionsBatchItemDto implements Built<DocumentTagSuggestionsBatchItemDto, DocumentTagSuggestionsBatchItemDtoBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'suggestions')
  BuiltList<JsonObject> get suggestions;

  DocumentTagSuggestionsBatchItemDto._();

  factory DocumentTagSuggestionsBatchItemDto([void updates(DocumentTagSuggestionsBatchItemDtoBuilder b)]) = _$DocumentTagSuggestionsBatchItemDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentTagSuggestionsBatchItemDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentTagSuggestionsBatchItemDto> get serializer => _$DocumentTagSuggestionsBatchItemDtoSerializer();
}

class _$DocumentTagSuggestionsBatchItemDtoSerializer implements PrimitiveSerializer<DocumentTagSuggestionsBatchItemDto> {
  @override
  final Iterable<Type> types = const [DocumentTagSuggestionsBatchItemDto, _$DocumentTagSuggestionsBatchItemDto];

  @override
  final String wireName = r'DocumentTagSuggestionsBatchItemDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentTagSuggestionsBatchItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    yield r'suggestions';
    yield serializers.serialize(
      object.suggestions,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentTagSuggestionsBatchItemDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentTagSuggestionsBatchItemDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentId = valueDes;
          break;
        case r'suggestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.suggestions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentTagSuggestionsBatchItemDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentTagSuggestionsBatchItemDtoBuilder();
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

