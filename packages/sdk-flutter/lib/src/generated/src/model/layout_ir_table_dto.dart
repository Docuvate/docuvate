//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/layout_ir_table_cell_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_table_dto.g.dart';

/// LayoutIrTableDto
///
/// Properties:
/// * [page] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [columnCount] 
/// * [rows] 
@BuiltValue()
abstract class LayoutIrTableDto implements Built<LayoutIrTableDto, LayoutIrTableDtoBuilder> {
  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'x')
  num get x;

  @BuiltValueField(wireName: r'y')
  num get y;

  @BuiltValueField(wireName: r'width')
  num get width;

  @BuiltValueField(wireName: r'height')
  num get height;

  @BuiltValueField(wireName: r'columnCount')
  num get columnCount;

  @BuiltValueField(wireName: r'rows')
  BuiltList<BuiltList<LayoutIrTableCellDto>> get rows;

  LayoutIrTableDto._();

  factory LayoutIrTableDto([void updates(LayoutIrTableDtoBuilder b)]) = _$LayoutIrTableDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrTableDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrTableDto> get serializer => _$LayoutIrTableDtoSerializer();
}

class _$LayoutIrTableDtoSerializer implements PrimitiveSerializer<LayoutIrTableDto> {
  @override
  final Iterable<Type> types = const [LayoutIrTableDto, _$LayoutIrTableDto];

  @override
  final String wireName = r'LayoutIrTableDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrTableDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
    );
    yield r'x';
    yield serializers.serialize(
      object.x,
      specifiedType: const FullType(num),
    );
    yield r'y';
    yield serializers.serialize(
      object.y,
      specifiedType: const FullType(num),
    );
    yield r'width';
    yield serializers.serialize(
      object.width,
      specifiedType: const FullType(num),
    );
    yield r'height';
    yield serializers.serialize(
      object.height,
      specifiedType: const FullType(num),
    );
    yield r'columnCount';
    yield serializers.serialize(
      object.columnCount,
      specifiedType: const FullType(num),
    );
    yield r'rows';
    yield serializers.serialize(
      object.rows,
      specifiedType: const FullType(BuiltList, [FullType(BuiltList, [FullType(LayoutIrTableCellDto)])]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrTableDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrTableDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'x':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.x = valueDes;
          break;
        case r'y':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.y = valueDes;
          break;
        case r'width':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.width = valueDes;
          break;
        case r'height':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.height = valueDes;
          break;
        case r'columnCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.columnCount = valueDes;
          break;
        case r'rows':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(BuiltList, [FullType(LayoutIrTableCellDto)])]),
          ) as BuiltList<BuiltList<LayoutIrTableCellDto>>;
          result.rows.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrTableDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrTableDtoBuilder();
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

