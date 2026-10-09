//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_table_cell_dto.g.dart';

/// LayoutIrTableCellDto
///
/// Properties:
/// * [text] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [fontSizePt] 
/// * [weight] 
/// * [blockIndex] 
/// * [cellRole] 
@BuiltValue()
abstract class LayoutIrTableCellDto implements Built<LayoutIrTableCellDto, LayoutIrTableCellDtoBuilder> {
  @BuiltValueField(wireName: r'text')
  String get text;

  @BuiltValueField(wireName: r'x')
  num get x;

  @BuiltValueField(wireName: r'y')
  num get y;

  @BuiltValueField(wireName: r'width')
  num get width;

  @BuiltValueField(wireName: r'height')
  num get height;

  @BuiltValueField(wireName: r'fontSizePt')
  num? get fontSizePt;

  @BuiltValueField(wireName: r'weight')
  String? get weight;

  @BuiltValueField(wireName: r'blockIndex')
  num? get blockIndex;

  @BuiltValueField(wireName: r'cellRole')
  String? get cellRole;

  LayoutIrTableCellDto._();

  factory LayoutIrTableCellDto([void updates(LayoutIrTableCellDtoBuilder b)]) = _$LayoutIrTableCellDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrTableCellDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrTableCellDto> get serializer => _$LayoutIrTableCellDtoSerializer();
}

class _$LayoutIrTableCellDtoSerializer implements PrimitiveSerializer<LayoutIrTableCellDto> {
  @override
  final Iterable<Type> types = const [LayoutIrTableCellDto, _$LayoutIrTableCellDto];

  @override
  final String wireName = r'LayoutIrTableCellDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrTableCellDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
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
    if (object.fontSizePt != null) {
      yield r'fontSizePt';
      yield serializers.serialize(
        object.fontSizePt,
        specifiedType: const FullType(num),
      );
    }
    if (object.weight != null) {
      yield r'weight';
      yield serializers.serialize(
        object.weight,
        specifiedType: const FullType(String),
      );
    }
    if (object.blockIndex != null) {
      yield r'blockIndex';
      yield serializers.serialize(
        object.blockIndex,
        specifiedType: const FullType(num),
      );
    }
    if (object.cellRole != null) {
      yield r'cellRole';
      yield serializers.serialize(
        object.cellRole,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrTableCellDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrTableCellDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
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
        case r'fontSizePt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.fontSizePt = valueDes;
          break;
        case r'weight':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.weight = valueDes;
          break;
        case r'blockIndex':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.blockIndex = valueDes;
          break;
        case r'cellRole':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.cellRole = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrTableCellDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrTableCellDtoBuilder();
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

