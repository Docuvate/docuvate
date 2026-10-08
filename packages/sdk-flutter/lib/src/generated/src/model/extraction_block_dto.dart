//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'extraction_block_dto.g.dart';

/// ExtractionBlockDto
///
/// Properties:
/// * [page] 
/// * [x] 
/// * [y] 
/// * [width] 
/// * [height] 
/// * [text] 
/// * [blockIndex] 
@BuiltValue()
abstract class ExtractionBlockDto implements Built<ExtractionBlockDto, ExtractionBlockDtoBuilder> {
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

  @BuiltValueField(wireName: r'blockIndex')
  num? get blockIndex;

  ExtractionBlockDto._();

  factory ExtractionBlockDto([void updates(ExtractionBlockDtoBuilder b)]) = _$ExtractionBlockDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExtractionBlockDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExtractionBlockDto> get serializer => _$ExtractionBlockDtoSerializer();
}

class _$ExtractionBlockDtoSerializer implements PrimitiveSerializer<ExtractionBlockDto> {
  @override
  final Iterable<Type> types = const [ExtractionBlockDto, _$ExtractionBlockDto];

  @override
  final String wireName = r'ExtractionBlockDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExtractionBlockDto object, {
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
    ExtractionBlockDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExtractionBlockDtoBuilder result,
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
  ExtractionBlockDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExtractionBlockDtoBuilder();
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

