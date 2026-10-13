//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/feature_flags_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'remote_config_response_dto.g.dart';

/// RemoteConfigResponseDto
///
/// Properties:
/// * [featureFlags] 
@BuiltValue()
abstract class RemoteConfigResponseDto implements Built<RemoteConfigResponseDto, RemoteConfigResponseDtoBuilder> {
  @BuiltValueField(wireName: r'featureFlags')
  FeatureFlagsResponseDto get featureFlags;

  RemoteConfigResponseDto._();

  factory RemoteConfigResponseDto([void updates(RemoteConfigResponseDtoBuilder b)]) = _$RemoteConfigResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RemoteConfigResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RemoteConfigResponseDto> get serializer => _$RemoteConfigResponseDtoSerializer();
}

class _$RemoteConfigResponseDtoSerializer implements PrimitiveSerializer<RemoteConfigResponseDto> {
  @override
  final Iterable<Type> types = const [RemoteConfigResponseDto, _$RemoteConfigResponseDto];

  @override
  final String wireName = r'RemoteConfigResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RemoteConfigResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'featureFlags';
    yield serializers.serialize(
      object.featureFlags,
      specifiedType: const FullType(FeatureFlagsResponseDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RemoteConfigResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RemoteConfigResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'featureFlags':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(FeatureFlagsResponseDto),
          ) as FeatureFlagsResponseDto;
          result.featureFlags.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RemoteConfigResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RemoteConfigResponseDtoBuilder();
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

