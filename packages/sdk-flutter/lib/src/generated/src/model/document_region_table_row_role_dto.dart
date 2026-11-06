//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_table_row_role_dto.g.dart';

/// DocumentRegionTableRowRoleDto
///
/// Properties:
/// * [row] 
/// * [role] 
@BuiltValue()
abstract class DocumentRegionTableRowRoleDto implements Built<DocumentRegionTableRowRoleDto, DocumentRegionTableRowRoleDtoBuilder> {
  @BuiltValueField(wireName: r'row')
  num get row;

  @BuiltValueField(wireName: r'role')
  DocumentRegionTableRowRoleDtoRoleEnum get role;
  // enum roleEnum {  section,  subtotal,  };

  DocumentRegionTableRowRoleDto._();

  factory DocumentRegionTableRowRoleDto([void updates(DocumentRegionTableRowRoleDtoBuilder b)]) = _$DocumentRegionTableRowRoleDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionTableRowRoleDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionTableRowRoleDto> get serializer => _$DocumentRegionTableRowRoleDtoSerializer();
}

class _$DocumentRegionTableRowRoleDtoSerializer implements PrimitiveSerializer<DocumentRegionTableRowRoleDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionTableRowRoleDto, _$DocumentRegionTableRowRoleDto];

  @override
  final String wireName = r'DocumentRegionTableRowRoleDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionTableRowRoleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'row';
    yield serializers.serialize(
      object.row,
      specifiedType: const FullType(num),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(DocumentRegionTableRowRoleDtoRoleEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionTableRowRoleDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionTableRowRoleDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'row':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.row = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentRegionTableRowRoleDtoRoleEnum),
          ) as DocumentRegionTableRowRoleDtoRoleEnum;
          result.role = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentRegionTableRowRoleDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionTableRowRoleDtoBuilder();
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

class DocumentRegionTableRowRoleDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'section')
  static const DocumentRegionTableRowRoleDtoRoleEnum section = _$documentRegionTableRowRoleDtoRoleEnum_section;
  @BuiltValueEnumConst(wireName: r'subtotal')
  static const DocumentRegionTableRowRoleDtoRoleEnum subtotal = _$documentRegionTableRowRoleDtoRoleEnum_subtotal;

  static Serializer<DocumentRegionTableRowRoleDtoRoleEnum> get serializer => _$documentRegionTableRowRoleDtoRoleEnumSerializer;

  const DocumentRegionTableRowRoleDtoRoleEnum._(String name): super(name);

  static BuiltSet<DocumentRegionTableRowRoleDtoRoleEnum> get values => _$documentRegionTableRowRoleDtoRoleEnumValues;
  static DocumentRegionTableRowRoleDtoRoleEnum valueOf(String name) => _$documentRegionTableRowRoleDtoRoleEnumValueOf(name);
}

