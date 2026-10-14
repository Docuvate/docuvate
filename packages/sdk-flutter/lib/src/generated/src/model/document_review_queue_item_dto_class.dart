//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_duplicate_stack_summary_dto_class.dart';
import 'package:docuvate/src/generated/src/model/document_review_field_suggestion_dto_class.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_review_queue_item_dto_class.g.dart';

/// DocumentReviewQueueItemDtoClass
///
/// Properties:
/// * [documentId] 
/// * [title] 
/// * [filename] 
/// * [documentDate] 
/// * [suggestedDocumentDate] 
/// * [uploadDate] 
/// * [labelSuggestions] 
/// * [fieldSuggestions] 
/// * [duplicateStack] 
@BuiltValue()
abstract class DocumentReviewQueueItemDtoClass implements Built<DocumentReviewQueueItemDtoClass, DocumentReviewQueueItemDtoClassBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'filename')
  String get filename;

  @BuiltValueField(wireName: r'documentDate')
  String? get documentDate;

  @BuiltValueField(wireName: r'suggestedDocumentDate')
  String? get suggestedDocumentDate;

  @BuiltValueField(wireName: r'uploadDate')
  String get uploadDate;

  @BuiltValueField(wireName: r'labelSuggestions')
  BuiltList<JsonObject> get labelSuggestions;

  @BuiltValueField(wireName: r'fieldSuggestions')
  BuiltList<DocumentReviewFieldSuggestionDtoClass> get fieldSuggestions;

  @BuiltValueField(wireName: r'duplicateStack')
  DocumentDuplicateStackSummaryDtoClass? get duplicateStack;

  DocumentReviewQueueItemDtoClass._();

  factory DocumentReviewQueueItemDtoClass([void updates(DocumentReviewQueueItemDtoClassBuilder b)]) = _$DocumentReviewQueueItemDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentReviewQueueItemDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentReviewQueueItemDtoClass> get serializer => _$DocumentReviewQueueItemDtoClassSerializer();
}

class _$DocumentReviewQueueItemDtoClassSerializer implements PrimitiveSerializer<DocumentReviewQueueItemDtoClass> {
  @override
  final Iterable<Type> types = const [DocumentReviewQueueItemDtoClass, _$DocumentReviewQueueItemDtoClass];

  @override
  final String wireName = r'DocumentReviewQueueItemDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentReviewQueueItemDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'filename';
    yield serializers.serialize(
      object.filename,
      specifiedType: const FullType(String),
    );
    if (object.documentDate != null) {
      yield r'documentDate';
      yield serializers.serialize(
        object.documentDate,
        specifiedType: const FullType(String),
      );
    }
    if (object.suggestedDocumentDate != null) {
      yield r'suggestedDocumentDate';
      yield serializers.serialize(
        object.suggestedDocumentDate,
        specifiedType: const FullType(String),
      );
    }
    yield r'uploadDate';
    yield serializers.serialize(
      object.uploadDate,
      specifiedType: const FullType(String),
    );
    yield r'labelSuggestions';
    yield serializers.serialize(
      object.labelSuggestions,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
    yield r'fieldSuggestions';
    yield serializers.serialize(
      object.fieldSuggestions,
      specifiedType: const FullType(BuiltList, [FullType(DocumentReviewFieldSuggestionDtoClass)]),
    );
    if (object.duplicateStack != null) {
      yield r'duplicateStack';
      yield serializers.serialize(
        object.duplicateStack,
        specifiedType: const FullType(DocumentDuplicateStackSummaryDtoClass),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentReviewQueueItemDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentReviewQueueItemDtoClassBuilder result,
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
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'filename':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.filename = valueDes;
          break;
        case r'documentDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentDate = valueDes;
          break;
        case r'suggestedDocumentDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.suggestedDocumentDate = valueDes;
          break;
        case r'uploadDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.uploadDate = valueDes;
          break;
        case r'labelSuggestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.labelSuggestions.replace(valueDes);
          break;
        case r'fieldSuggestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentReviewFieldSuggestionDtoClass)]),
          ) as BuiltList<DocumentReviewFieldSuggestionDtoClass>;
          result.fieldSuggestions.replace(valueDes);
          break;
        case r'duplicateStack':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentDuplicateStackSummaryDtoClass),
          ) as DocumentDuplicateStackSummaryDtoClass;
          result.duplicateStack.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentReviewQueueItemDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentReviewQueueItemDtoClassBuilder();
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

