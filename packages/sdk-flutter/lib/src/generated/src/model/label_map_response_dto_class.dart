//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'label_map_response_dto_class.g.dart';

/// LabelMapResponseDtoClass
///
/// Properties:
/// * [points] 
/// * [documentCount] 
/// * [tagCount] 
/// * [extractedDocumentCount] 
/// * [emptyReason] 
@BuiltValue()
abstract class LabelMapResponseDtoClass implements Built<LabelMapResponseDtoClass, LabelMapResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'points')
  BuiltList<JsonObject> get points;

  @BuiltValueField(wireName: r'documentCount')
  num get documentCount;

  @BuiltValueField(wireName: r'tagCount')
  num get tagCount;

  @BuiltValueField(wireName: r'extractedDocumentCount')
  num get extractedDocumentCount;

  @BuiltValueField(wireName: r'emptyReason')
  LabelMapResponseDtoClassEmptyReasonEnum? get emptyReason;
  // enum emptyReasonEnum {  no_extracted_documents,  awaiting_embeddings,  embedding_unavailable,  };

  LabelMapResponseDtoClass._();

  factory LabelMapResponseDtoClass([void updates(LabelMapResponseDtoClassBuilder b)]) = _$LabelMapResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LabelMapResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LabelMapResponseDtoClass> get serializer => _$LabelMapResponseDtoClassSerializer();
}

class _$LabelMapResponseDtoClassSerializer implements PrimitiveSerializer<LabelMapResponseDtoClass> {
  @override
  final Iterable<Type> types = const [LabelMapResponseDtoClass, _$LabelMapResponseDtoClass];

  @override
  final String wireName = r'LabelMapResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LabelMapResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'points';
    yield serializers.serialize(
      object.points,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
    yield r'documentCount';
    yield serializers.serialize(
      object.documentCount,
      specifiedType: const FullType(num),
    );
    yield r'tagCount';
    yield serializers.serialize(
      object.tagCount,
      specifiedType: const FullType(num),
    );
    yield r'extractedDocumentCount';
    yield serializers.serialize(
      object.extractedDocumentCount,
      specifiedType: const FullType(num),
    );
    if (object.emptyReason != null) {
      yield r'emptyReason';
      yield serializers.serialize(
        object.emptyReason,
        specifiedType: const FullType(LabelMapResponseDtoClassEmptyReasonEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LabelMapResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LabelMapResponseDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'points':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.points.replace(valueDes);
          break;
        case r'documentCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.documentCount = valueDes;
          break;
        case r'tagCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.tagCount = valueDes;
          break;
        case r'extractedDocumentCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.extractedDocumentCount = valueDes;
          break;
        case r'emptyReason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LabelMapResponseDtoClassEmptyReasonEnum),
          ) as LabelMapResponseDtoClassEmptyReasonEnum;
          result.emptyReason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LabelMapResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LabelMapResponseDtoClassBuilder();
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

class LabelMapResponseDtoClassEmptyReasonEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'no_extracted_documents')
  static const LabelMapResponseDtoClassEmptyReasonEnum noExtractedDocuments = _$labelMapResponseDtoClassEmptyReasonEnum_noExtractedDocuments;
  @BuiltValueEnumConst(wireName: r'awaiting_embeddings')
  static const LabelMapResponseDtoClassEmptyReasonEnum awaitingEmbeddings = _$labelMapResponseDtoClassEmptyReasonEnum_awaitingEmbeddings;
  @BuiltValueEnumConst(wireName: r'embedding_unavailable')
  static const LabelMapResponseDtoClassEmptyReasonEnum embeddingUnavailable = _$labelMapResponseDtoClassEmptyReasonEnum_embeddingUnavailable;

  static Serializer<LabelMapResponseDtoClassEmptyReasonEnum> get serializer => _$labelMapResponseDtoClassEmptyReasonEnumSerializer;

  const LabelMapResponseDtoClassEmptyReasonEnum._(String name): super(name);

  static BuiltSet<LabelMapResponseDtoClassEmptyReasonEnum> get values => _$labelMapResponseDtoClassEmptyReasonEnumValues;
  static LabelMapResponseDtoClassEmptyReasonEnum valueOf(String name) => _$labelMapResponseDtoClassEmptyReasonEnumValueOf(name);
}

