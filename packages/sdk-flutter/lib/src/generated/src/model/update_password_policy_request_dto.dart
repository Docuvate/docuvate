//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_password_policy_request_dto.g.dart';

/// UpdatePasswordPolicyRequestDto
///
/// Properties:
/// * [minLength] 
/// * [requireLower] 
/// * [requireUpper] 
/// * [requireDigit] 
/// * [requireSymbol] 
/// * [checkBreached] 
@BuiltValue()
abstract class UpdatePasswordPolicyRequestDto implements Built<UpdatePasswordPolicyRequestDto, UpdatePasswordPolicyRequestDtoBuilder> {
  @BuiltValueField(wireName: r'minLength')
  num get minLength;

  @BuiltValueField(wireName: r'requireLower')
  bool get requireLower;

  @BuiltValueField(wireName: r'requireUpper')
  bool get requireUpper;

  @BuiltValueField(wireName: r'requireDigit')
  bool get requireDigit;

  @BuiltValueField(wireName: r'requireSymbol')
  bool get requireSymbol;

  @BuiltValueField(wireName: r'checkBreached')
  bool get checkBreached;

  UpdatePasswordPolicyRequestDto._();

  factory UpdatePasswordPolicyRequestDto([void updates(UpdatePasswordPolicyRequestDtoBuilder b)]) = _$UpdatePasswordPolicyRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdatePasswordPolicyRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdatePasswordPolicyRequestDto> get serializer => _$UpdatePasswordPolicyRequestDtoSerializer();
}

class _$UpdatePasswordPolicyRequestDtoSerializer implements PrimitiveSerializer<UpdatePasswordPolicyRequestDto> {
  @override
  final Iterable<Type> types = const [UpdatePasswordPolicyRequestDto, _$UpdatePasswordPolicyRequestDto];

  @override
  final String wireName = r'UpdatePasswordPolicyRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdatePasswordPolicyRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'minLength';
    yield serializers.serialize(
      object.minLength,
      specifiedType: const FullType(num),
    );
    yield r'requireLower';
    yield serializers.serialize(
      object.requireLower,
      specifiedType: const FullType(bool),
    );
    yield r'requireUpper';
    yield serializers.serialize(
      object.requireUpper,
      specifiedType: const FullType(bool),
    );
    yield r'requireDigit';
    yield serializers.serialize(
      object.requireDigit,
      specifiedType: const FullType(bool),
    );
    yield r'requireSymbol';
    yield serializers.serialize(
      object.requireSymbol,
      specifiedType: const FullType(bool),
    );
    yield r'checkBreached';
    yield serializers.serialize(
      object.checkBreached,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdatePasswordPolicyRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdatePasswordPolicyRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'minLength':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.minLength = valueDes;
          break;
        case r'requireLower':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.requireLower = valueDes;
          break;
        case r'requireUpper':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.requireUpper = valueDes;
          break;
        case r'requireDigit':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.requireDigit = valueDes;
          break;
        case r'requireSymbol':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.requireSymbol = valueDes;
          break;
        case r'checkBreached':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.checkBreached = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdatePasswordPolicyRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdatePasswordPolicyRequestDtoBuilder();
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

