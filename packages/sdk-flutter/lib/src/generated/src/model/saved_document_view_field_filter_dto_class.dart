//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
part 'move_documents_previous_folder_dto.g.dart';

/// MoveDocumentsPreviousFolderDto
///
/// Properties:
/// * [documentId] 
/// * [folderId] 
@BuiltValue()
abstract class MoveDocumentsPreviousFolderDto implements Built<MoveDocumentsPreviousFolderDto, MoveDocumentsPreviousFolderDtoBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'folderId')
  String get folderId;

  MoveDocumentsPreviousFolderDto._();

  factory MoveDocumentsPreviousFolderDto([void updates(MoveDocumentsPreviousFolderDtoBuilder b)]) = _$MoveDocumentsPreviousFolderDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MoveDocumentsPreviousFolderDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MoveDocumentsPreviousFolderDto> get serializer => _$MoveDocumentsPreviousFolderDtoSerializer();
}

class _$MoveDocumentsPreviousFolderDtoSerializer implements PrimitiveSerializer<MoveDocumentsPreviousFolderDto> {
  @override
  final Iterable<Type> types = const [MoveDocumentsPreviousFolderDto, _$MoveDocumentsPreviousFolderDto];

  @override
  final String wireName = r'MoveDocumentsPreviousFolderDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MoveDocumentsPreviousFolderDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    yield r'folderId';
    yield serializers.serialize(
      object.folderId,
========
part 'saved_document_view_field_filter_dto_class.g.dart';

/// SavedDocumentViewFieldFilterDtoClass
///
/// Properties:
/// * [fieldKey] 
/// * [valueText] 
@BuiltValue()
abstract class SavedDocumentViewFieldFilterDtoClass implements Built<SavedDocumentViewFieldFilterDtoClass, SavedDocumentViewFieldFilterDtoClassBuilder> {
  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  @BuiltValueField(wireName: r'valueText')
  String get valueText;

  SavedDocumentViewFieldFilterDtoClass._();

  factory SavedDocumentViewFieldFilterDtoClass([void updates(SavedDocumentViewFieldFilterDtoClassBuilder b)]) = _$SavedDocumentViewFieldFilterDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedDocumentViewFieldFilterDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedDocumentViewFieldFilterDtoClass> get serializer => _$SavedDocumentViewFieldFilterDtoClassSerializer();
}

class _$SavedDocumentViewFieldFilterDtoClassSerializer implements PrimitiveSerializer<SavedDocumentViewFieldFilterDtoClass> {
  @override
  final Iterable<Type> types = const [SavedDocumentViewFieldFilterDtoClass, _$SavedDocumentViewFieldFilterDtoClass];

  @override
  final String wireName = r'SavedDocumentViewFieldFilterDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedDocumentViewFieldFilterDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    yield r'valueText';
    yield serializers.serialize(
      object.valueText,
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
    MoveDocumentsPreviousFolderDto object, {
========
    SavedDocumentViewFieldFilterDtoClass object, {
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
    required MoveDocumentsPreviousFolderDtoBuilder result,
========
    required SavedDocumentViewFieldFilterDtoClassBuilder result,
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
        case r'documentId':
========
        case r'fieldKey':
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
          result.documentId = valueDes;
          break;
        case r'folderId':
========
          result.fieldKey = valueDes;
          break;
        case r'valueText':
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
          result.folderId = valueDes;
========
          result.valueText = valueDes;
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
  MoveDocumentsPreviousFolderDto deserialize(
========
  SavedDocumentViewFieldFilterDtoClass deserialize(
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
<<<<<<<< HEAD:packages/sdk-flutter/lib/src/generated/src/model/move_documents_previous_folder_dto.dart
    final result = MoveDocumentsPreviousFolderDtoBuilder();
========
    final result = SavedDocumentViewFieldFilterDtoClassBuilder();
>>>>>>>> 940356b9 (fix(api): drop correspondents routes from OpenAPI and stabilize migration undo test):packages/sdk-flutter/lib/src/generated/src/model/saved_document_view_field_filter_dto_class.dart
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

