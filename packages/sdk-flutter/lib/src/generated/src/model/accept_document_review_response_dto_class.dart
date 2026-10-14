//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_document_review_response_dto_class.g.dart';

/// AcceptDocumentReviewResponseDtoClass
///
/// Properties:
/// * [documentId] 
/// * [acceptedLabels] 
/// * [acceptedFields] 
@BuiltValue()
abstract class AcceptDocumentReviewResponseDtoClass implements Built<AcceptDocumentReviewResponseDtoClass, AcceptDocumentReviewResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'acceptedLabels')
  num get acceptedLabels;

  @BuiltValueField(wireName: r'acceptedFields')
  num get acceptedFields;

  AcceptDocumentReviewResponseDtoClass._();

  factory AcceptDocumentReviewResponseDtoClass([void updates(AcceptDocumentReviewResponseDtoClassBuilder b)]) = _$AcceptDocumentReviewResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptDocumentReviewResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptDocumentReviewResponseDtoClass> get serializer => _$AcceptDocumentReviewResponseDtoClassSerializer();
}

class _$AcceptDocumentReviewResponseDtoClassSerializer implements PrimitiveSerializer<AcceptDocumentReviewResponseDtoClass> {
  @override
  final Iterable<Type> types = const [AcceptDocumentReviewResponseDtoClass, _$AcceptDocumentReviewResponseDtoClass];

  @override
  final String wireName = r'AcceptDocumentReviewResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptDocumentReviewResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
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
    AcceptDocumentReviewResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AcceptDocumentReviewResponseDtoClassBuilder result,
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
  AcceptDocumentReviewResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptDocumentReviewResponseDtoClassBuilder();
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

