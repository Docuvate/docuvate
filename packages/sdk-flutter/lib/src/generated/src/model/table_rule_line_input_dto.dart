//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'table_rule_line_input_dto.g.dart';

/// TableRuleLineInputDto
///
/// Properties:
/// * [axis] 
/// * [ord] 
/// * [line] 
@BuiltValue()
abstract class TableRuleLineInputDto implements Built<TableRuleLineInputDto, TableRuleLineInputDtoBuilder> {
  @BuiltValueField(wireName: r'axis')
  TableRuleLineInputDtoAxisEnum get axis;
  // enum axisEnum {  row,  col,  };

  @BuiltValueField(wireName: r'ord')
  num get ord;

  @BuiltValueField(wireName: r'line')
  TableRuleLineInputDtoLineEnum get line;
  // enum lineEnum {  unknown,  none,  thin,  thick,  double,  };

  TableRuleLineInputDto._();

  factory TableRuleLineInputDto([void updates(TableRuleLineInputDtoBuilder b)]) = _$TableRuleLineInputDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TableRuleLineInputDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TableRuleLineInputDto> get serializer => _$TableRuleLineInputDtoSerializer();
}

class _$TableRuleLineInputDtoSerializer implements PrimitiveSerializer<TableRuleLineInputDto> {
  @override
  final Iterable<Type> types = const [TableRuleLineInputDto, _$TableRuleLineInputDto];

  @override
  final String wireName = r'TableRuleLineInputDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TableRuleLineInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'axis';
    yield serializers.serialize(
      object.axis,
      specifiedType: const FullType(TableRuleLineInputDtoAxisEnum),
    );
    yield r'ord';
    yield serializers.serialize(
      object.ord,
      specifiedType: const FullType(num),
    );
    yield r'line';
    yield serializers.serialize(
      object.line,
      specifiedType: const FullType(TableRuleLineInputDtoLineEnum),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TableRuleLineInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TableRuleLineInputDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'axis':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(TableRuleLineInputDtoAxisEnum),
          ) as TableRuleLineInputDtoAxisEnum;
          result.axis = valueDes;
          break;
        case r'ord':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.ord = valueDes;
          break;
        case r'line':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(TableRuleLineInputDtoLineEnum),
          ) as TableRuleLineInputDtoLineEnum;
          result.line = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TableRuleLineInputDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TableRuleLineInputDtoBuilder();
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

class TableRuleLineInputDtoAxisEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'row')
  static const TableRuleLineInputDtoAxisEnum row = _$tableRuleLineInputDtoAxisEnum_row;
  @BuiltValueEnumConst(wireName: r'col')
  static const TableRuleLineInputDtoAxisEnum col = _$tableRuleLineInputDtoAxisEnum_col;

  static Serializer<TableRuleLineInputDtoAxisEnum> get serializer => _$tableRuleLineInputDtoAxisEnumSerializer;

  const TableRuleLineInputDtoAxisEnum._(String name): super(name);

  static BuiltSet<TableRuleLineInputDtoAxisEnum> get values => _$tableRuleLineInputDtoAxisEnumValues;
  static TableRuleLineInputDtoAxisEnum valueOf(String name) => _$tableRuleLineInputDtoAxisEnumValueOf(name);
}

class TableRuleLineInputDtoLineEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'unknown')
  static const TableRuleLineInputDtoLineEnum unknown = _$tableRuleLineInputDtoLineEnum_unknown;
  @BuiltValueEnumConst(wireName: r'none')
  static const TableRuleLineInputDtoLineEnum none = _$tableRuleLineInputDtoLineEnum_none;
  @BuiltValueEnumConst(wireName: r'thin')
  static const TableRuleLineInputDtoLineEnum thin = _$tableRuleLineInputDtoLineEnum_thin;
  @BuiltValueEnumConst(wireName: r'thick')
  static const TableRuleLineInputDtoLineEnum thick = _$tableRuleLineInputDtoLineEnum_thick;
  @BuiltValueEnumConst(wireName: r'double')
  static const TableRuleLineInputDtoLineEnum double_ = _$tableRuleLineInputDtoLineEnum_double_;

  static Serializer<TableRuleLineInputDtoLineEnum> get serializer => _$tableRuleLineInputDtoLineEnumSerializer;

  const TableRuleLineInputDtoLineEnum._(String name): super(name);

  static BuiltSet<TableRuleLineInputDtoLineEnum> get values => _$tableRuleLineInputDtoLineEnumValues;
  static TableRuleLineInputDtoLineEnum valueOf(String name) => _$tableRuleLineInputDtoLineEnumValueOf(name);
}

