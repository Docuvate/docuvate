//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_document_review_batch_request_dto.g.dart';

/// AcceptDocumentReviewBatchRequestDto
///
/// Properties:
/// * [minConfidence] 
@BuiltValue()
abstract class AcceptDocumentReviewBatchRequestDto implements Built<AcceptDocumentReviewBatchRequestDto, AcceptDocumentReviewBatchRequestDtoBuilder> {
  @BuiltValueField(wireName: r'minConfidence')
  num? get minConfidence;

  AcceptDocumentReviewBatchRequestDto._();

  factory AcceptDocumentReviewBatchRequestDto([void updates(AcceptDocumentReviewBatchRequestDtoBuilder b)]) = _$AcceptDocumentReviewBatchRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptDocumentReviewBatchRequestDtoBuilder b) => b
      ..minConfidence = 0.9;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptDocumentReviewBatchRequestDto> get serializer => _$AcceptDocumentReviewBatchRequestDtoSerializer();
}

class _$AcceptDocumentReviewBatchRequestDtoSerializer implements PrimitiveSerializer<AcceptDocumentReviewBatchRequestDto> {
  @override
  final Iterable<Type> types = const [AcceptDocumentReviewBatchRequestDto, _$AcceptDocumentReviewBatchRequestDto];

  @override
  final String wireName = r'AcceptDocumentReviewBatchRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptDocumentReviewBatchRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.minConfidence != null) {
      yield r'minConfidence';
      yield serializers.serialize(
        object.minConfidence,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptDocumentReviewBatchRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AcceptDocumentReviewBatchRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'minConfidence':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.minConfidence = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptDocumentReviewBatchRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptDocumentReviewBatchRequestDtoBuilder();
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

