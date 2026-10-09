//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_vector_dto.g.dart';

/// LayoutIrVectorDto
///
/// Properties:
/// * [kind] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [strokeWidthPt] 
/// * [filled] 
/// * [fillGray] 
/// * [fillRgb] 
/// * [strokeRgb] 
/// * [pathD] 
@BuiltValue()
abstract class LayoutIrVectorDto implements Built<LayoutIrVectorDto, LayoutIrVectorDtoBuilder> {
  @BuiltValueField(wireName: r'kind')
  LayoutIrVectorDtoKindEnum get kind;
  // enum kindEnum {  rect,  line,  path,  };

  @BuiltValueField(wireName: r'x')
  num get x;

  @BuiltValueField(wireName: r'y')
  num get y;

  @BuiltValueField(wireName: r'width')
  num get width;

  @BuiltValueField(wireName: r'height')
  num get height;

  @BuiltValueField(wireName: r'strokeWidthPt')
  num? get strokeWidthPt;

  @BuiltValueField(wireName: r'filled')
  bool? get filled;

  @BuiltValueField(wireName: r'fillGray')
  num? get fillGray;

  @BuiltValueField(wireName: r'fillRgb')
  BuiltList<num>? get fillRgb;

  @BuiltValueField(wireName: r'strokeRgb')
  BuiltList<num>? get strokeRgb;

  @BuiltValueField(wireName: r'pathD')
  String? get pathD;

  LayoutIrVectorDto._();

  factory LayoutIrVectorDto([void updates(LayoutIrVectorDtoBuilder b)]) = _$LayoutIrVectorDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrVectorDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrVectorDto> get serializer => _$LayoutIrVectorDtoSerializer();
}

class _$LayoutIrVectorDtoSerializer implements PrimitiveSerializer<LayoutIrVectorDto> {
  @override
  final Iterable<Type> types = const [LayoutIrVectorDto, _$LayoutIrVectorDto];

  @override
  final String wireName = r'LayoutIrVectorDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrVectorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'kind';
    yield serializers.serialize(
      object.kind,
      specifiedType: const FullType(LayoutIrVectorDtoKindEnum),
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
    if (object.strokeWidthPt != null) {
      yield r'strokeWidthPt';
      yield serializers.serialize(
        object.strokeWidthPt,
        specifiedType: const FullType(num),
      );
    }
    if (object.filled != null) {
      yield r'filled';
      yield serializers.serialize(
        object.filled,
        specifiedType: const FullType(bool),
      );
    }
    if (object.fillGray != null) {
      yield r'fillGray';
      yield serializers.serialize(
        object.fillGray,
        specifiedType: const FullType(num),
      );
    }
    if (object.fillRgb != null) {
      yield r'fillRgb';
      yield serializers.serialize(
        object.fillRgb,
        specifiedType: const FullType(BuiltList, [FullType(num)]),
      );
    }
    if (object.strokeRgb != null) {
      yield r'strokeRgb';
      yield serializers.serialize(
        object.strokeRgb,
        specifiedType: const FullType(BuiltList, [FullType(num)]),
      );
    }
    if (object.pathD != null) {
      yield r'pathD';
      yield serializers.serialize(
        object.pathD,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrVectorDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrVectorDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'kind':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LayoutIrVectorDtoKindEnum),
          ) as LayoutIrVectorDtoKindEnum;
          result.kind = valueDes;
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
        case r'strokeWidthPt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.strokeWidthPt = valueDes;
          break;
        case r'filled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.filled = valueDes;
          break;
        case r'fillGray':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.fillGray = valueDes;
          break;
        case r'fillRgb':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(num)]),
          ) as BuiltList<num>;
          result.fillRgb.replace(valueDes);
          break;
        case r'strokeRgb':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(num)]),
          ) as BuiltList<num>;
          result.strokeRgb.replace(valueDes);
          break;
        case r'pathD':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.pathD = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrVectorDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrVectorDtoBuilder();
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

class LayoutIrVectorDtoKindEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'rect')
  static const LayoutIrVectorDtoKindEnum rect = _$layoutIrVectorDtoKindEnum_rect;
  @BuiltValueEnumConst(wireName: r'line')
  static const LayoutIrVectorDtoKindEnum line = _$layoutIrVectorDtoKindEnum_line;
  @BuiltValueEnumConst(wireName: r'path')
  static const LayoutIrVectorDtoKindEnum path = _$layoutIrVectorDtoKindEnum_path;

  static Serializer<LayoutIrVectorDtoKindEnum> get serializer => _$layoutIrVectorDtoKindEnumSerializer;

  const LayoutIrVectorDtoKindEnum._(String name): super(name);

  static BuiltSet<LayoutIrVectorDtoKindEnum> get values => _$layoutIrVectorDtoKindEnumValues;
  static LayoutIrVectorDtoKindEnum valueOf(String name) => _$layoutIrVectorDtoKindEnumValueOf(name);
}

