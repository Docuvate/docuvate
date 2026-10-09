//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_extraction_summary_dto.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_response_dto.g.dart';

/// DocumentResponseDto
///
/// Properties:
/// * [id] 
/// * [filename] 
/// * [title] 
/// * [status] 
/// * [mimeType] 
/// * [tags] 
/// * [createdAt] 
/// * [updatedAt] 
/// * [extraction] 
@BuiltValue()
abstract class DocumentResponseDto implements Built<DocumentResponseDto, DocumentResponseDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'filename')
  String get filename;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'status')
  DocumentResponseDtoStatusEnum get status;
  // enum statusEnum {  uploaded,  queued,  extracting,  ready,  failed,  };

  @BuiltValueField(wireName: r'mimeType')
  String get mimeType;

  @BuiltValueField(wireName: r'tags')
  BuiltList<JsonObject> get tags;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  @BuiltValueField(wireName: r'extraction')
  DocumentExtractionSummaryDto? get extraction;

  DocumentResponseDto._();

  factory DocumentResponseDto([void updates(DocumentResponseDtoBuilder b)]) = _$DocumentResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentResponseDto> get serializer => _$DocumentResponseDtoSerializer();
}

class _$DocumentResponseDtoSerializer implements PrimitiveSerializer<DocumentResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentResponseDto, _$DocumentResponseDto];

  @override
  final String wireName = r'DocumentResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'filename';
    yield serializers.serialize(
      object.filename,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(DocumentResponseDtoStatusEnum),
    );
    yield r'mimeType';
    yield serializers.serialize(
      object.mimeType,
      specifiedType: const FullType(String),
    );
    yield r'tags';
    yield serializers.serialize(
      object.tags,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
    if (object.extraction != null) {
      yield r'extraction';
      yield serializers.serialize(
        object.extraction,
        specifiedType: const FullType(DocumentExtractionSummaryDto),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'filename':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.filename = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentResponseDtoStatusEnum),
          ) as DocumentResponseDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'mimeType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mimeType = valueDes;
          break;
        case r'tags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.tags.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'extraction':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentExtractionSummaryDto),
          ) as DocumentExtractionSummaryDto;
          result.extraction.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentResponseDtoBuilder();
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

class DocumentResponseDtoStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'uploaded')
  static const DocumentResponseDtoStatusEnum uploaded = _$documentResponseDtoStatusEnum_uploaded;
  @BuiltValueEnumConst(wireName: r'queued')
  static const DocumentResponseDtoStatusEnum queued = _$documentResponseDtoStatusEnum_queued;
  @BuiltValueEnumConst(wireName: r'extracting')
  static const DocumentResponseDtoStatusEnum extracting = _$documentResponseDtoStatusEnum_extracting;
  @BuiltValueEnumConst(wireName: r'ready')
  static const DocumentResponseDtoStatusEnum ready = _$documentResponseDtoStatusEnum_ready;
  @BuiltValueEnumConst(wireName: r'failed')
  static const DocumentResponseDtoStatusEnum failed = _$documentResponseDtoStatusEnum_failed;

  static Serializer<DocumentResponseDtoStatusEnum> get serializer => _$documentResponseDtoStatusEnumSerializer;

  const DocumentResponseDtoStatusEnum._(String name): super(name);

  static BuiltSet<DocumentResponseDtoStatusEnum> get values => _$documentResponseDtoStatusEnumValues;
  static DocumentResponseDtoStatusEnum valueOf(String name) => _$documentResponseDtoStatusEnumValueOf(name);
}

