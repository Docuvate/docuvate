//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_region_field_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_dto.g.dart';

/// DocumentRegionDto
///
/// Properties:
/// * [id] 
/// * [documentId] 
/// * [page] 
/// * [shape] 
/// * [role] 
/// * [x0] 
/// * [y0] 
/// * [x1] 
/// * [y1] 
/// * [irSha256] 
/// * [needsReview] 
/// * [blockIndexes] 
/// * [field] 
/// * [createdAt] 
@BuiltValue()
abstract class DocumentRegionDto implements Built<DocumentRegionDto, DocumentRegionDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'shape')
  DocumentRegionDtoShapeEnum get shape;
  // enum shapeEnum {  rect,  polygon,  };

  @BuiltValueField(wireName: r'role')
  DocumentRegionDtoRoleEnum get role;
  // enum roleEnum {  field,  table,  block,  ignore,  };

  @BuiltValueField(wireName: r'x0')
  num get x0;

  @BuiltValueField(wireName: r'y0')
  num get y0;

  @BuiltValueField(wireName: r'x1')
  num get x1;

  @BuiltValueField(wireName: r'y1')
  num get y1;

  @BuiltValueField(wireName: r'irSha256')
  String get irSha256;

  @BuiltValueField(wireName: r'needsReview')
  bool get needsReview;

  @BuiltValueField(wireName: r'blockIndexes')
  BuiltList<num> get blockIndexes;

  @BuiltValueField(wireName: r'field')
  DocumentRegionFieldDto? get field;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  DocumentRegionDto._();

  factory DocumentRegionDto([void updates(DocumentRegionDtoBuilder b)]) = _$DocumentRegionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionDto> get serializer => _$DocumentRegionDtoSerializer();
}

class _$DocumentRegionDtoSerializer implements PrimitiveSerializer<DocumentRegionDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionDto, _$DocumentRegionDto];

  @override
  final String wireName = r'DocumentRegionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionDto object, {
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
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
    );
    yield r'shape';
    yield serializers.serialize(
      object.shape,
      specifiedType: const FullType(DocumentRegionDtoShapeEnum),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(DocumentRegionDtoRoleEnum),
    );
    yield r'x0';
    yield serializers.serialize(
      object.x0,
      specifiedType: const FullType(num),
    );
    yield r'y0';
    yield serializers.serialize(
      object.y0,
      specifiedType: const FullType(num),
    );
    yield r'x1';
    yield serializers.serialize(
      object.x1,
      specifiedType: const FullType(num),
    );
    yield r'y1';
    yield serializers.serialize(
      object.y1,
      specifiedType: const FullType(num),
    );
    yield r'irSha256';
    yield serializers.serialize(
      object.irSha256,
      specifiedType: const FullType(String),
    );
    yield r'needsReview';
    yield serializers.serialize(
      object.needsReview,
      specifiedType: const FullType(bool),
    );
    yield r'blockIndexes';
    yield serializers.serialize(
      object.blockIndexes,
      specifiedType: const FullType(BuiltList, [FullType(num)]),
    );
    if (object.field != null) {
      yield r'field';
      yield serializers.serialize(
        object.field,
        specifiedType: const FullType(DocumentRegionFieldDto),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionDtoBuilder result,
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
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'shape':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionDtoShapeEnum),
          ) as DocumentRegionDtoShapeEnum;
          result.shape = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionDtoRoleEnum),
          ) as DocumentRegionDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'x0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x0 = valueDes;
          break;
        case r'y0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y0 = valueDes;
          break;
        case r'x1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x1 = valueDes;
          break;
        case r'y1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y1 = valueDes;
          break;
        case r'irSha256':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.irSha256 = valueDes;
          break;
        case r'needsReview':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.needsReview = valueDes;
          break;
        case r'blockIndexes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(num)]),
          ) as BuiltList<num>;
          result.blockIndexes.replace(valueDes);
          break;
        case r'field':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionFieldDto),
          ) as DocumentRegionFieldDto;
          result.field.replace(valueDes);
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
  DocumentRegionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionDtoBuilder();
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

class DocumentRegionDtoShapeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'rect')
  static const DocumentRegionDtoShapeEnum rect = _$documentRegionDtoShapeEnum_rect;
  @BuiltValueEnumConst(wireName: r'polygon')
  static const DocumentRegionDtoShapeEnum polygon = _$documentRegionDtoShapeEnum_polygon;

  static Serializer<DocumentRegionDtoShapeEnum> get serializer => _$documentRegionDtoShapeEnumSerializer;

  const DocumentRegionDtoShapeEnum._(String name): super(name);

  static BuiltSet<DocumentRegionDtoShapeEnum> get values => _$documentRegionDtoShapeEnumValues;
  static DocumentRegionDtoShapeEnum valueOf(String name) => _$documentRegionDtoShapeEnumValueOf(name);
}

class DocumentRegionDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'field')
  static const DocumentRegionDtoRoleEnum field = _$documentRegionDtoRoleEnum_field;
  @BuiltValueEnumConst(wireName: r'table')
  static const DocumentRegionDtoRoleEnum table = _$documentRegionDtoRoleEnum_table;
  @BuiltValueEnumConst(wireName: r'block')
  static const DocumentRegionDtoRoleEnum block = _$documentRegionDtoRoleEnum_block;
  @BuiltValueEnumConst(wireName: r'ignore')
  static const DocumentRegionDtoRoleEnum ignore = _$documentRegionDtoRoleEnum_ignore;

  static Serializer<DocumentRegionDtoRoleEnum> get serializer => _$documentRegionDtoRoleEnumSerializer;

  const DocumentRegionDtoRoleEnum._(String name): super(name);

  static BuiltSet<DocumentRegionDtoRoleEnum> get values => _$documentRegionDtoRoleEnumValues;
  static DocumentRegionDtoRoleEnum valueOf(String name) => _$documentRegionDtoRoleEnumValueOf(name);
}

