//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'table_merge_input_dto.g.dart';

/// TableMergeInputDto
///
/// Properties:
/// * [row0] 
/// * [col0] 
/// * [rowSpan] 
/// * [colSpan] 
@BuiltValue()
abstract class TableMergeInputDto implements Built<TableMergeInputDto, TableMergeInputDtoBuilder> {
  @BuiltValueField(wireName: r'row0')
  num get row0;

  @BuiltValueField(wireName: r'col0')
  num get col0;

  @BuiltValueField(wireName: r'rowSpan')
  num get rowSpan;

  @BuiltValueField(wireName: r'colSpan')
  num get colSpan;

  TableMergeInputDto._();

  factory TableMergeInputDto([void updates(TableMergeInputDtoBuilder b)]) = _$TableMergeInputDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TableMergeInputDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TableMergeInputDto> get serializer => _$TableMergeInputDtoSerializer();
}

class _$TableMergeInputDtoSerializer implements PrimitiveSerializer<TableMergeInputDto> {
  @override
  final Iterable<Type> types = const [TableMergeInputDto, _$TableMergeInputDto];

  @override
  final String wireName = r'TableMergeInputDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TableMergeInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'row0';
    yield serializers.serialize(
      object.row0,
      specifiedType: const FullType(num),
    );
    yield r'col0';
    yield serializers.serialize(
      object.col0,
      specifiedType: const FullType(num),
    );
    yield r'rowSpan';
    yield serializers.serialize(
      object.rowSpan,
      specifiedType: const FullType(num),
    );
    yield r'colSpan';
    yield serializers.serialize(
      object.colSpan,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TableMergeInputDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TableMergeInputDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'row0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.row0 = valueDes;
          break;
        case r'col0':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.col0 = valueDes;
          break;
        case r'rowSpan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.rowSpan = valueDes;
          break;
        case r'colSpan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.colSpan = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TableMergeInputDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TableMergeInputDtoBuilder();
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

