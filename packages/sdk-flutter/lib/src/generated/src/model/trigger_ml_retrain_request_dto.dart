//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'trigger_ml_retrain_request_dto.g.dart';

/// TriggerMlRetrainRequestDto
///
/// Properties:
/// * [familyId] 
@BuiltValue()
abstract class TriggerMlRetrainRequestDto implements Built<TriggerMlRetrainRequestDto, TriggerMlRetrainRequestDtoBuilder> {
  @BuiltValueField(wireName: r'familyId')
  String get familyId;

  TriggerMlRetrainRequestDto._();

  factory TriggerMlRetrainRequestDto([void updates(TriggerMlRetrainRequestDtoBuilder b)]) = _$TriggerMlRetrainRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TriggerMlRetrainRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TriggerMlRetrainRequestDto> get serializer => _$TriggerMlRetrainRequestDtoSerializer();
}

class _$TriggerMlRetrainRequestDtoSerializer implements PrimitiveSerializer<TriggerMlRetrainRequestDto> {
  @override
  final Iterable<Type> types = const [TriggerMlRetrainRequestDto, _$TriggerMlRetrainRequestDto];

  @override
  final String wireName = r'TriggerMlRetrainRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TriggerMlRetrainRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'familyId';
    yield serializers.serialize(
      object.familyId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TriggerMlRetrainRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TriggerMlRetrainRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'familyId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.familyId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TriggerMlRetrainRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TriggerMlRetrainRequestDtoBuilder();
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

