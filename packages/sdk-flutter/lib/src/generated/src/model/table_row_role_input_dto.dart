//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'table_row_role_input_dto.g.dart';

/// TableRowRoleInputDto
///
/// Properties:
/// * [row] 
/// * [role] 
@BuiltValue()
abstract class TableRowRoleInputDto implements Built<TableRowRoleInputDto, TableRowRoleInputDtoBuilder> {
  @BuiltValueField(wireName: r'row')
  num get row;

  @BuiltValueField(wireName: r'role')
  TableRowRoleInputDtoRoleEnum get role;
  // enum roleEnum {  section,  subtotal,  };

  TableRowRoleInputDto._();

  factory TableRowRoleInputDto([void updates(TableRowRoleInputDtoBuilder b)]) = _$TableRowRoleInputDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TableRowRoleInputDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TableRowRoleInputDto> get serializer => _$TableRowRoleInputDtoSerializer();
}

class _$TableRowRoleInputDtoSerializer implements PrimitiveSerializer<TableRowRoleInputDto> {
  @override
  final Iterable<Type> types = const [TableRowRoleInputDto, _$TableRowRoleInputDto];

  @override
  final String wireName = r'TableRowRoleInputDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TableRowRoleInputDto object, {
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
      specifiedType: const FullType(TableRowRoleInputDtoRoleEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TableRowRoleInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TableRowRoleInputDtoBuilder result,
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
            specifiedType: const FullType(TableRowRoleInputDtoRoleEnum),
          ) as TableRowRoleInputDtoRoleEnum;
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
  TableRowRoleInputDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TableRowRoleInputDtoBuilder();
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

class TableRowRoleInputDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'section')
  static const TableRowRoleInputDtoRoleEnum section = _$tableRowRoleInputDtoRoleEnum_section;
  @BuiltValueEnumConst(wireName: r'subtotal')
  static const TableRowRoleInputDtoRoleEnum subtotal = _$tableRowRoleInputDtoRoleEnum_subtotal;

  static Serializer<TableRowRoleInputDtoRoleEnum> get serializer => _$tableRowRoleInputDtoRoleEnumSerializer;

  const TableRowRoleInputDtoRoleEnum._(String name): super(name);

  static BuiltSet<TableRowRoleInputDtoRoleEnum> get values => _$tableRowRoleInputDtoRoleEnumValues;
  static TableRowRoleInputDtoRoleEnum valueOf(String name) => _$tableRowRoleInputDtoRoleEnumValueOf(name);
}

