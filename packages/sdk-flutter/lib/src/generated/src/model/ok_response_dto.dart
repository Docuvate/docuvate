//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ok_response_dto.g.dart';

/// OkResponseDto
///
/// Properties:
/// * [ok] 
@BuiltValue()
abstract class OkResponseDto implements Built<OkResponseDto, OkResponseDtoBuilder> {
  @BuiltValueField(wireName: r'ok')
  bool get ok;

  OkResponseDto._();

  factory OkResponseDto([void updates(OkResponseDtoBuilder b)]) = _$OkResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OkResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OkResponseDto> get serializer => _$OkResponseDtoSerializer();
}

class _$OkResponseDtoSerializer implements PrimitiveSerializer<OkResponseDto> {
  @override
  final Iterable<Type> types = const [OkResponseDto, _$OkResponseDto];

  @override
  final String wireName = r'OkResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OkResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ok';
    yield serializers.serialize(
      object.ok,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    OkResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required OkResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ok':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.ok = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  OkResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OkResponseDtoBuilder();
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

