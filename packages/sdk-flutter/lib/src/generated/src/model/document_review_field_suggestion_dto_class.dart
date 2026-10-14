//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_review_field_suggestion_dto_class.g.dart';

/// DocumentReviewFieldSuggestionDtoClass
///
/// Properties:
/// * [key] 
/// * [displayLabel] 
/// * [value] 
/// * [confidence] 
@BuiltValue()
abstract class DocumentReviewFieldSuggestionDtoClass implements Built<DocumentReviewFieldSuggestionDtoClass, DocumentReviewFieldSuggestionDtoClassBuilder> {
  @BuiltValueField(wireName: r'key')
  String get key;

  @BuiltValueField(wireName: r'displayLabel')
  String get displayLabel;

  @BuiltValueField(wireName: r'value')
  String get value;

  @BuiltValueField(wireName: r'confidence')
  num? get confidence;

  DocumentReviewFieldSuggestionDtoClass._();

  factory DocumentReviewFieldSuggestionDtoClass([void updates(DocumentReviewFieldSuggestionDtoClassBuilder b)]) = _$DocumentReviewFieldSuggestionDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentReviewFieldSuggestionDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentReviewFieldSuggestionDtoClass> get serializer => _$DocumentReviewFieldSuggestionDtoClassSerializer();
}

class _$DocumentReviewFieldSuggestionDtoClassSerializer implements PrimitiveSerializer<DocumentReviewFieldSuggestionDtoClass> {
  @override
  final Iterable<Type> types = const [DocumentReviewFieldSuggestionDtoClass, _$DocumentReviewFieldSuggestionDtoClass];

  @override
  final String wireName = r'DocumentReviewFieldSuggestionDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentReviewFieldSuggestionDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'key';
    yield serializers.serialize(
      object.key,
      specifiedType: const FullType(String),
    );
    yield r'displayLabel';
    yield serializers.serialize(
      object.displayLabel,
      specifiedType: const FullType(String),
    );
    yield r'value';
    yield serializers.serialize(
      object.value,
      specifiedType: const FullType(String),
    );
    if (object.confidence != null) {
      yield r'confidence';
      yield serializers.serialize(
        object.confidence,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentReviewFieldSuggestionDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentReviewFieldSuggestionDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'key':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.key = valueDes;
          break;
        case r'displayLabel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayLabel = valueDes;
          break;
        case r'value':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.value = valueDes;
          break;
        case r'confidence':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.confidence = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentReviewFieldSuggestionDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentReviewFieldSuggestionDtoClassBuilder();
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

