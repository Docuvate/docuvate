//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_bulk_action_dto.g.dart';

/// DocumentBulkActionDto
///
/// Properties:
/// * [action] 
/// * [tagId] 
/// * [correspondentId] 
/// * [folderId] 
@BuiltValue()
abstract class DocumentBulkActionDto implements Built<DocumentBulkActionDto, DocumentBulkActionDtoBuilder> {
  @BuiltValueField(wireName: r'action')
  DocumentBulkActionDtoActionEnum get action;
  // enum actionEnum {  addTag,  removeTag,  setCorrespondent,  setFolder,  delete,  };

  @BuiltValueField(wireName: r'tagId')
  String? get tagId;

  @BuiltValueField(wireName: r'correspondentId')
  String? get correspondentId;

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  DocumentBulkActionDto._();

  factory DocumentBulkActionDto([void updates(DocumentBulkActionDtoBuilder b)]) = _$DocumentBulkActionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentBulkActionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentBulkActionDto> get serializer => _$DocumentBulkActionDtoSerializer();
}

class _$DocumentBulkActionDtoSerializer implements PrimitiveSerializer<DocumentBulkActionDto> {
  @override
  final Iterable<Type> types = const [DocumentBulkActionDto, _$DocumentBulkActionDto];

  @override
  final String wireName = r'DocumentBulkActionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentBulkActionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'action';
    yield serializers.serialize(
      object.action,
      specifiedType: const FullType(DocumentBulkActionDtoActionEnum),
    );
    if (object.tagId != null) {
      yield r'tagId';
      yield serializers.serialize(
        object.tagId,
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
    if (object.folderId != null) {
      yield r'folderId';
      yield serializers.serialize(
        object.folderId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentBulkActionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentBulkActionDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'action':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentBulkActionDtoActionEnum),
          ) as DocumentBulkActionDtoActionEnum;
          result.action = valueDes;
          break;
        case r'tagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.tagId = valueDes;
          break;
        case r'correspondentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.correspondentId = valueDes;
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentBulkActionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentBulkActionDtoBuilder();
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

class DocumentBulkActionDtoActionEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'addTag')
  static const DocumentBulkActionDtoActionEnum addTag = _$documentBulkActionDtoActionEnum_addTag;
  @BuiltValueEnumConst(wireName: r'removeTag')
  static const DocumentBulkActionDtoActionEnum removeTag = _$documentBulkActionDtoActionEnum_removeTag;
  @BuiltValueEnumConst(wireName: r'setCorrespondent')
  static const DocumentBulkActionDtoActionEnum setCorrespondent = _$documentBulkActionDtoActionEnum_setCorrespondent;
  @BuiltValueEnumConst(wireName: r'setFolder')
  static const DocumentBulkActionDtoActionEnum setFolder = _$documentBulkActionDtoActionEnum_setFolder;
  @BuiltValueEnumConst(wireName: r'delete')
  static const DocumentBulkActionDtoActionEnum delete = _$documentBulkActionDtoActionEnum_delete;

  static Serializer<DocumentBulkActionDtoActionEnum> get serializer => _$documentBulkActionDtoActionEnumSerializer;

  const DocumentBulkActionDtoActionEnum._(String name): super(name);

  static BuiltSet<DocumentBulkActionDtoActionEnum> get values => _$documentBulkActionDtoActionEnumValues;
  static DocumentBulkActionDtoActionEnum valueOf(String name) => _$documentBulkActionDtoActionEnumValueOf(name);
}

