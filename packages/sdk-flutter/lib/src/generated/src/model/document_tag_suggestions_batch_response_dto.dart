//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_tag_suggestions_batch_item_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_tag_suggestions_batch_response_dto.g.dart';

/// DocumentTagSuggestionsBatchResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class DocumentTagSuggestionsBatchResponseDto implements Built<DocumentTagSuggestionsBatchResponseDto, DocumentTagSuggestionsBatchResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<DocumentTagSuggestionsBatchItemDto> get items;

  DocumentTagSuggestionsBatchResponseDto._();

  factory DocumentTagSuggestionsBatchResponseDto([void updates(DocumentTagSuggestionsBatchResponseDtoBuilder b)]) = _$DocumentTagSuggestionsBatchResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentTagSuggestionsBatchResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentTagSuggestionsBatchResponseDto> get serializer => _$DocumentTagSuggestionsBatchResponseDtoSerializer();
}

class _$DocumentTagSuggestionsBatchResponseDtoSerializer implements PrimitiveSerializer<DocumentTagSuggestionsBatchResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentTagSuggestionsBatchResponseDto, _$DocumentTagSuggestionsBatchResponseDto];

  @override
  final String wireName = r'DocumentTagSuggestionsBatchResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentTagSuggestionsBatchResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(DocumentTagSuggestionsBatchItemDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentTagSuggestionsBatchResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentTagSuggestionsBatchResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentTagSuggestionsBatchItemDto)]),
          ) as BuiltList<DocumentTagSuggestionsBatchItemDto>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentTagSuggestionsBatchResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentTagSuggestionsBatchResponseDtoBuilder();
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

