//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_mappe_request_dto.g.dart';

/// CreateMappeRequestDto
///
/// Properties:
/// * [name] 
/// * [color] 
@BuiltValue()
abstract class CreateMappeRequestDto implements Built<CreateMappeRequestDto, CreateMappeRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'color')
  String? get color;

  CreateMappeRequestDto._();

  factory CreateMappeRequestDto([void updates(CreateMappeRequestDtoBuilder b)]) = _$CreateMappeRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateMappeRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateMappeRequestDto> get serializer => _$CreateMappeRequestDtoSerializer();
}

class _$CreateMappeRequestDtoSerializer implements PrimitiveSerializer<CreateMappeRequestDto> {
  @override
  final Iterable<Type> types = const [CreateMappeRequestDto, _$CreateMappeRequestDto];

  @override
  final String wireName = r'CreateMappeRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateMappeRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.color != null) {
      yield r'color';
      yield serializers.serialize(
        object.color,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateMappeRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateMappeRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'color':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.color = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateMappeRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateMappeRequestDtoBuilder();
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

