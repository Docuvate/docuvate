//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_mappe_request_dto.g.dart';

/// UpdateMappeRequestDto
///
/// Properties:
/// * [name] 
/// * [color] 
@BuiltValue()
abstract class UpdateMappeRequestDto implements Built<UpdateMappeRequestDto, UpdateMappeRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'color')
  String? get color;

  UpdateMappeRequestDto._();

  factory UpdateMappeRequestDto([void updates(UpdateMappeRequestDtoBuilder b)]) = _$UpdateMappeRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateMappeRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateMappeRequestDto> get serializer => _$UpdateMappeRequestDtoSerializer();
}

class _$UpdateMappeRequestDtoSerializer implements PrimitiveSerializer<UpdateMappeRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateMappeRequestDto, _$UpdateMappeRequestDto];

  @override
  final String wireName = r'UpdateMappeRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateMappeRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
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
    UpdateMappeRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateMappeRequestDtoBuilder result,
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
  UpdateMappeRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateMappeRequestDtoBuilder();
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

