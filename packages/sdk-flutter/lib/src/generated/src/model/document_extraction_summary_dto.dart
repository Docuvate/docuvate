//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_extraction_summary_dto_layout_ir_pages_inner.dart';
import 'package:docuvate/src/generated/src/model/extracted_field_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_extraction_summary_dto.g.dart';

/// DocumentExtractionSummaryDto
///
/// Properties:
/// * [text] 
/// * [fields] 
/// * [markdown] 
/// * [layoutIrAvailable] - True when persisted layout IR exists (fetch via GET /documents/:id/layout-ir).
/// * [layoutIrPages] - Page dimensions from persisted layout IR (no block payload).
@BuiltValue()
abstract class DocumentExtractionSummaryDto implements Built<DocumentExtractionSummaryDto, DocumentExtractionSummaryDtoBuilder> {
  @BuiltValueField(wireName: r'text')
  String get text;

  @BuiltValueField(wireName: r'fields')
  BuiltList<ExtractedFieldDto> get fields;

  @BuiltValueField(wireName: r'markdown')
  String? get markdown;

  /// True when persisted layout IR exists (fetch via GET /documents/:id/layout-ir).
  @BuiltValueField(wireName: r'layoutIrAvailable')
  bool? get layoutIrAvailable;

  /// Page dimensions from persisted layout IR (no block payload).
  @BuiltValueField(wireName: r'layoutIrPages')
  BuiltList<DocumentExtractionSummaryDtoLayoutIrPagesInner>? get layoutIrPages;

  DocumentExtractionSummaryDto._();

  factory DocumentExtractionSummaryDto([void updates(DocumentExtractionSummaryDtoBuilder b)]) = _$DocumentExtractionSummaryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentExtractionSummaryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentExtractionSummaryDto> get serializer => _$DocumentExtractionSummaryDtoSerializer();
}

class _$DocumentExtractionSummaryDtoSerializer implements PrimitiveSerializer<DocumentExtractionSummaryDto> {
  @override
  final Iterable<Type> types = const [DocumentExtractionSummaryDto, _$DocumentExtractionSummaryDto];

  @override
  final String wireName = r'DocumentExtractionSummaryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentExtractionSummaryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
    yield r'fields';
    yield serializers.serialize(
      object.fields,
      specifiedType: const FullType(BuiltList, [FullType(ExtractedFieldDto)]),
    );
    if (object.markdown != null) {
      yield r'markdown';
      yield serializers.serialize(
        object.markdown,
        specifiedType: const FullType(String),
      );
    }
    if (object.layoutIrAvailable != null) {
      yield r'layoutIrAvailable';
      yield serializers.serialize(
        object.layoutIrAvailable,
        specifiedType: const FullType(bool),
      );
    }
    if (object.layoutIrPages != null) {
      yield r'layoutIrPages';
      yield serializers.serialize(
        object.layoutIrPages,
        specifiedType: const FullType(BuiltList, [FullType(DocumentExtractionSummaryDtoLayoutIrPagesInner)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentExtractionSummaryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentExtractionSummaryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        case r'fields':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExtractedFieldDto)]),
          ) as BuiltList<ExtractedFieldDto>;
          result.fields.replace(valueDes);
          break;
        case r'markdown':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.markdown = valueDes;
          break;
        case r'layoutIrAvailable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.layoutIrAvailable = valueDes;
          break;
        case r'layoutIrPages':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentExtractionSummaryDtoLayoutIrPagesInner)]),
          ) as BuiltList<DocumentExtractionSummaryDtoLayoutIrPagesInner>;
          result.layoutIrPages.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentExtractionSummaryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentExtractionSummaryDtoBuilder();
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

