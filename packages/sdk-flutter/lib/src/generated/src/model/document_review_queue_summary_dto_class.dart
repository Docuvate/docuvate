//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_review_queue_summary_dto_class.g.dart';

/// DocumentReviewQueueSummaryDtoClass
///
/// Properties:
/// * [pendingCount] 
@BuiltValue()
abstract class DocumentReviewQueueSummaryDtoClass implements Built<DocumentReviewQueueSummaryDtoClass, DocumentReviewQueueSummaryDtoClassBuilder> {
  @BuiltValueField(wireName: r'pendingCount')
  num get pendingCount;

  DocumentReviewQueueSummaryDtoClass._();

  factory DocumentReviewQueueSummaryDtoClass([void updates(DocumentReviewQueueSummaryDtoClassBuilder b)]) = _$DocumentReviewQueueSummaryDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentReviewQueueSummaryDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentReviewQueueSummaryDtoClass> get serializer => _$DocumentReviewQueueSummaryDtoClassSerializer();
}

class _$DocumentReviewQueueSummaryDtoClassSerializer implements PrimitiveSerializer<DocumentReviewQueueSummaryDtoClass> {
  @override
  final Iterable<Type> types = const [DocumentReviewQueueSummaryDtoClass, _$DocumentReviewQueueSummaryDtoClass];

  @override
  final String wireName = r'DocumentReviewQueueSummaryDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentReviewQueueSummaryDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'pendingCount';
    yield serializers.serialize(
      object.pendingCount,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentReviewQueueSummaryDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentReviewQueueSummaryDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'pendingCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.pendingCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentReviewQueueSummaryDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentReviewQueueSummaryDtoClassBuilder();
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

