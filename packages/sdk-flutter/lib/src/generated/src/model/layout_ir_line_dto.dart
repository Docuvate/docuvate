//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_ir_line_dto.g.dart';

/// LayoutIrLineDto
///
/// Properties:
/// * [page] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [text] 
/// * [fontFamily] 
/// * [fontSizePt] 
/// * [weight] 
/// * [align] 
/// * [blockIndex] 
@BuiltValue()
abstract class LayoutIrLineDto implements Built<LayoutIrLineDto, LayoutIrLineDtoBuilder> {
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

  @BuiltValueField(wireName: r'text')
  String get text;

  @BuiltValueField(wireName: r'fontFamily')
  String? get fontFamily;

  @BuiltValueField(wireName: r'fontSizePt')
  num? get fontSizePt;

  @BuiltValueField(wireName: r'weight')
  String? get weight;

  @BuiltValueField(wireName: r'align')
  String? get align;

  @BuiltValueField(wireName: r'blockIndex')
  num? get blockIndex;

  LayoutIrLineDto._();

  factory LayoutIrLineDto([void updates(LayoutIrLineDtoBuilder b)]) = _$LayoutIrLineDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutIrLineDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutIrLineDto> get serializer => _$LayoutIrLineDtoSerializer();
}

class _$LayoutIrLineDtoSerializer implements PrimitiveSerializer<LayoutIrLineDto> {
  @override
  final Iterable<Type> types = const [LayoutIrLineDto, _$LayoutIrLineDto];

  @override
  final String wireName = r'LayoutIrLineDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutIrLineDto object, {
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
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
    if (object.fontFamily != null) {
      yield r'fontFamily';
      yield serializers.serialize(
        object.fontFamily,
        specifiedType: const FullType(String),
      );
    }
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
    if (object.align != null) {
      yield r'align';
      yield serializers.serialize(
        object.align,
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
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutIrLineDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutIrLineDtoBuilder result,
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
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        case r'fontFamily':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.fontFamily = valueDes;
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
        case r'align':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.align = valueDes;
          break;
        case r'blockIndex':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.blockIndex = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutIrLineDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutIrLineDtoBuilder();
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

