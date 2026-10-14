//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_document_review_batch_response_dto_class.g.dart';

/// AcceptDocumentReviewBatchResponseDtoClass
///
/// Properties:
/// * [documentsProcessed] 
/// * [acceptedLabels] 
/// * [acceptedFields] 
@BuiltValue()
abstract class AcceptDocumentReviewBatchResponseDtoClass implements Built<AcceptDocumentReviewBatchResponseDtoClass, AcceptDocumentReviewBatchResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'documentsProcessed')
  num get documentsProcessed;

  @BuiltValueField(wireName: r'acceptedLabels')
  num get acceptedLabels;

  @BuiltValueField(wireName: r'acceptedFields')
  num get acceptedFields;

  AcceptDocumentReviewBatchResponseDtoClass._();

  factory AcceptDocumentReviewBatchResponseDtoClass([void updates(AcceptDocumentReviewBatchResponseDtoClassBuilder b)]) = _$AcceptDocumentReviewBatchResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptDocumentReviewBatchResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptDocumentReviewBatchResponseDtoClass> get serializer => _$AcceptDocumentReviewBatchResponseDtoClassSerializer();
}

class _$AcceptDocumentReviewBatchResponseDtoClassSerializer implements PrimitiveSerializer<AcceptDocumentReviewBatchResponseDtoClass> {
  @override
  final Iterable<Type> types = const [AcceptDocumentReviewBatchResponseDtoClass, _$AcceptDocumentReviewBatchResponseDtoClass];

  @override
  final String wireName = r'AcceptDocumentReviewBatchResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptDocumentReviewBatchResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentsProcessed';
    yield serializers.serialize(
      object.documentsProcessed,
      specifiedType: const FullType(num),
    );
    yield r'acceptedLabels';
    yield serializers.serialize(
      object.acceptedLabels,
      specifiedType: const FullType(num),
    );
    yield r'acceptedFields';
    yield serializers.serialize(
      object.acceptedFields,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptDocumentReviewBatchResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AcceptDocumentReviewBatchResponseDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentsProcessed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.documentsProcessed = valueDes;
          break;
        case r'acceptedLabels':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.acceptedLabels = valueDes;
          break;
        case r'acceptedFields':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.acceptedFields = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptDocumentReviewBatchResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptDocumentReviewBatchResponseDtoClassBuilder();
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

