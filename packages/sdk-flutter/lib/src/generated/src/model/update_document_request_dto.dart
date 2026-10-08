//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/extraction_block_dto.dart';
import 'package:docuvate/src/generated/src/model/extracted_field_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_document_request_dto.g.dart';

/// UpdateDocumentRequestDto
///
/// Properties:
/// * [title] 
/// * [documentDate] 
/// * [notes] 
/// * [folderId] 
/// * [mappeId] 
/// * [correspondentId] 
/// * [tagIds] 
/// * [extractionFields] 
/// * [extractionBlocks] 
@BuiltValue()
abstract class UpdateDocumentRequestDto implements Built<UpdateDocumentRequestDto, UpdateDocumentRequestDtoBuilder> {
  @BuiltValueField(wireName: r'title')
  String? get title;

  @BuiltValueField(wireName: r'documentDate')
  String? get documentDate;

  @BuiltValueField(wireName: r'notes')
  String? get notes;

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  @BuiltValueField(wireName: r'mappeId')
  String? get mappeId;

  @BuiltValueField(wireName: r'correspondentId')
  String? get correspondentId;

  @BuiltValueField(wireName: r'tagIds')
  BuiltList<String>? get tagIds;

  @BuiltValueField(wireName: r'extractionFields')
  BuiltList<ExtractedFieldDto>? get extractionFields;

  @BuiltValueField(wireName: r'extractionBlocks')
  BuiltList<ExtractionBlockDto>? get extractionBlocks;

  UpdateDocumentRequestDto._();

  factory UpdateDocumentRequestDto([void updates(UpdateDocumentRequestDtoBuilder b)]) = _$UpdateDocumentRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateDocumentRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateDocumentRequestDto> get serializer => _$UpdateDocumentRequestDtoSerializer();
}

class _$UpdateDocumentRequestDtoSerializer implements PrimitiveSerializer<UpdateDocumentRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateDocumentRequestDto, _$UpdateDocumentRequestDto];

  @override
  final String wireName = r'UpdateDocumentRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateDocumentRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.title != null) {
      yield r'title';
      yield serializers.serialize(
        object.title,
        specifiedType: const FullType(String),
      );
    }
    if (object.documentDate != null) {
      yield r'documentDate';
      yield serializers.serialize(
        object.documentDate,
        specifiedType: const FullType(String),
      );
    }
    if (object.notes != null) {
      yield r'notes';
      yield serializers.serialize(
        object.notes,
        specifiedType: const FullType(String),
      );
    }
    if (object.folderId != null) {
      yield r'folderId';
      yield serializers.serialize(
        object.folderId,
        specifiedType: const FullType(String),
      );
    }
    if (object.mappeId != null) {
      yield r'mappeId';
      yield serializers.serialize(
        object.mappeId,
        specifiedType: const FullType(String),
      );
    }
    if (object.correspondentId != null) {
      yield r'correspondentId';
      yield serializers.serialize(
        object.correspondentId,
        specifiedType: const FullType(String),
      );
    }
    if (object.tagIds != null) {
      yield r'tagIds';
      yield serializers.serialize(
        object.tagIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.extractionFields != null) {
      yield r'extractionFields';
      yield serializers.serialize(
        object.extractionFields,
        specifiedType: const FullType(BuiltList, [FullType(ExtractedFieldDto)]),
      );
    }
    if (object.extractionBlocks != null) {
      yield r'extractionBlocks';
      yield serializers.serialize(
        object.extractionBlocks,
        specifiedType: const FullType(BuiltList, [FullType(ExtractionBlockDto)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateDocumentRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateDocumentRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'documentDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentDate = valueDes;
          break;
        case r'notes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.notes = valueDes;
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        case r'mappeId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mappeId = valueDes;
          break;
        case r'correspondentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.correspondentId = valueDes;
          break;
        case r'tagIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tagIds.replace(valueDes);
          break;
        case r'extractionFields':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExtractedFieldDto)]),
          ) as BuiltList<ExtractedFieldDto>;
          result.extractionFields.replace(valueDes);
          break;
        case r'extractionBlocks':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExtractionBlockDto)]),
          ) as BuiltList<ExtractionBlockDto>;
          result.extractionBlocks.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateDocumentRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateDocumentRequestDtoBuilder();
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

