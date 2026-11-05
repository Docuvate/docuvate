//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_token_dto.g.dart';

/// LayoutTokenDto
///
/// Properties:
/// * [blockIndex] 
/// * [page] 
/// * [x0] 
/// * [y0] 
/// * [x1] 
/// * [y1] 
/// * [text] 
@BuiltValue()
abstract class LayoutTokenDto implements Built<LayoutTokenDto, LayoutTokenDtoBuilder> {
  @BuiltValueField(wireName: r'blockIndex')
  num get blockIndex;

  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'x0')
  num get x0;

  @BuiltValueField(wireName: r'y0')
  num get y0;

  @BuiltValueField(wireName: r'x1')
  num get x1;

  @BuiltValueField(wireName: r'y1')
  num get y1;

  @BuiltValueField(wireName: r'text')
  String get text;

  LayoutTokenDto._();

  factory LayoutTokenDto([void updates(LayoutTokenDtoBuilder b)]) = _$LayoutTokenDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutTokenDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutTokenDto> get serializer => _$LayoutTokenDtoSerializer();
}

class _$LayoutTokenDtoSerializer implements PrimitiveSerializer<LayoutTokenDto> {
  @override
  final Iterable<Type> types = const [LayoutTokenDto, _$LayoutTokenDto];

  @override
  final String wireName = r'LayoutTokenDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutTokenDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'blockIndex';
    yield serializers.serialize(
      object.blockIndex,
      specifiedType: const FullType(num),
    );
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
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
    yield r'text';
    yield serializers.serialize(
      object.text,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutTokenDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutTokenDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'blockIndex':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.blockIndex = valueDes;
          break;
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
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
        case r'text':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.text = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutTokenDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutTokenDtoBuilder();
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

