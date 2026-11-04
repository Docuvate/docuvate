//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_correction_dto.g.dart';

/// DocumentCorrectionDto
///
/// Properties:
/// * [id] 
/// * [documentId] 
/// * [kind] 
/// * [status] 
/// * [op] 
/// * [fieldKey] 
/// * [beforeRegionId] 
/// * [afterRegionId] 
/// * [oldValue] 
/// * [newValue] 
/// * [createdAt] 
@BuiltValue()
abstract class DocumentCorrectionDto implements Built<DocumentCorrectionDto, DocumentCorrectionDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'kind')
  DocumentCorrectionDtoKindEnum get kind;
  // enum kindEnum {  label,  field,  table,  block,  };

  @BuiltValueField(wireName: r'status')
  DocumentCorrectionDtoStatusEnum get status;
  // enum statusEnum {  active,  withdrawn,  };

  @BuiltValueField(wireName: r'op')
  String get op;

  @BuiltValueField(wireName: r'fieldKey')
  String get fieldKey;

  @BuiltValueField(wireName: r'beforeRegionId')
  String get beforeRegionId;

  @BuiltValueField(wireName: r'afterRegionId')
  String get afterRegionId;

  @BuiltValueField(wireName: r'oldValue')
  String get oldValue;

  @BuiltValueField(wireName: r'newValue')
  String get newValue;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  DocumentCorrectionDto._();

  factory DocumentCorrectionDto([void updates(DocumentCorrectionDtoBuilder b)]) = _$DocumentCorrectionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentCorrectionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentCorrectionDto> get serializer => _$DocumentCorrectionDtoSerializer();
}

class _$DocumentCorrectionDtoSerializer implements PrimitiveSerializer<DocumentCorrectionDto> {
  @override
  final Iterable<Type> types = const [DocumentCorrectionDto, _$DocumentCorrectionDto];

  @override
  final String wireName = r'DocumentCorrectionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentCorrectionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(DocumentCorrectionDtoKindEnum),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(DocumentCorrectionDtoStatusEnum),
    );
    yield r'op';
    yield serializers.serialize(
      object.op,
      specifiedType: const FullType(String),
    );
    yield r'fieldKey';
    yield serializers.serialize(
      object.fieldKey,
      specifiedType: const FullType(String),
    );
    yield r'beforeRegionId';
    yield serializers.serialize(
      object.beforeRegionId,
      specifiedType: const FullType(String),
    );
    yield r'afterRegionId';
    yield serializers.serialize(
      object.afterRegionId,
      specifiedType: const FullType(String),
    );
    yield r'oldValue';
    yield serializers.serialize(
      object.oldValue,
      specifiedType: const FullType(String),
    );
    yield r'newValue';
    yield serializers.serialize(
      object.newValue,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentCorrectionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentCorrectionDtoBuilder result,
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
        case r'documentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentId = valueDes;
          break;
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentCorrectionDtoKindEnum),
          ) as DocumentCorrectionDtoKindEnum;
          result.kind = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentCorrectionDtoStatusEnum),
          ) as DocumentCorrectionDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'op':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.op = valueDes;
          break;
        case r'fieldKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fieldKey = valueDes;
          break;
        case r'beforeRegionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.beforeRegionId = valueDes;
          break;
        case r'afterRegionId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.afterRegionId = valueDes;
          break;
        case r'oldValue':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.oldValue = valueDes;
          break;
        case r'newValue':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.newValue = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentCorrectionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentCorrectionDtoBuilder();
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

class DocumentCorrectionDtoKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'label')
  static const DocumentCorrectionDtoKindEnum label = _$documentCorrectionDtoKindEnum_label;
  @BuiltValueEnumConst(wireName: r'field')
  static const DocumentCorrectionDtoKindEnum field = _$documentCorrectionDtoKindEnum_field;
  @BuiltValueEnumConst(wireName: r'table')
  static const DocumentCorrectionDtoKindEnum table = _$documentCorrectionDtoKindEnum_table;
  @BuiltValueEnumConst(wireName: r'block')
  static const DocumentCorrectionDtoKindEnum block = _$documentCorrectionDtoKindEnum_block;

  static Serializer<DocumentCorrectionDtoKindEnum> get serializer => _$documentCorrectionDtoKindEnumSerializer;

  const DocumentCorrectionDtoKindEnum._(String name): super(name);

  static BuiltSet<DocumentCorrectionDtoKindEnum> get values => _$documentCorrectionDtoKindEnumValues;
  static DocumentCorrectionDtoKindEnum valueOf(String name) => _$documentCorrectionDtoKindEnumValueOf(name);
}

class DocumentCorrectionDtoStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'active')
  static const DocumentCorrectionDtoStatusEnum active = _$documentCorrectionDtoStatusEnum_active;
  @BuiltValueEnumConst(wireName: r'withdrawn')
  static const DocumentCorrectionDtoStatusEnum withdrawn = _$documentCorrectionDtoStatusEnum_withdrawn;

  static Serializer<DocumentCorrectionDtoStatusEnum> get serializer => _$documentCorrectionDtoStatusEnumSerializer;

  const DocumentCorrectionDtoStatusEnum._(String name): super(name);

  static BuiltSet<DocumentCorrectionDtoStatusEnum> get values => _$documentCorrectionDtoStatusEnumValues;
  static DocumentCorrectionDtoStatusEnum valueOf(String name) => _$documentCorrectionDtoStatusEnumValueOf(name);
}

