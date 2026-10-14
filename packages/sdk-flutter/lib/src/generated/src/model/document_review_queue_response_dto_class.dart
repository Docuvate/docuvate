//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_review_queue_item_dto_class.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_review_queue_response_dto_class.g.dart';

/// DocumentReviewQueueResponseDtoClass
///
/// Properties:
/// * [total] 
/// * [items] 
@BuiltValue()
abstract class DocumentReviewQueueResponseDtoClass implements Built<DocumentReviewQueueResponseDtoClass, DocumentReviewQueueResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'total')
  num get total;

  @BuiltValueField(wireName: r'items')
  BuiltList<DocumentReviewQueueItemDtoClass> get items;

  DocumentReviewQueueResponseDtoClass._();

  factory DocumentReviewQueueResponseDtoClass([void updates(DocumentReviewQueueResponseDtoClassBuilder b)]) = _$DocumentReviewQueueResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentReviewQueueResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentReviewQueueResponseDtoClass> get serializer => _$DocumentReviewQueueResponseDtoClassSerializer();
}

class _$DocumentReviewQueueResponseDtoClassSerializer implements PrimitiveSerializer<DocumentReviewQueueResponseDtoClass> {
  @override
  final Iterable<Type> types = const [DocumentReviewQueueResponseDtoClass, _$DocumentReviewQueueResponseDtoClass];

  @override
  final String wireName = r'DocumentReviewQueueResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentReviewQueueResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(num),
    );
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(DocumentReviewQueueItemDtoClass)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentReviewQueueResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentReviewQueueResponseDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.total = valueDes;
          break;
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentReviewQueueItemDtoClass)]),
          ) as BuiltList<DocumentReviewQueueItemDtoClass>;
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
  DocumentReviewQueueResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentReviewQueueResponseDtoClassBuilder();
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

