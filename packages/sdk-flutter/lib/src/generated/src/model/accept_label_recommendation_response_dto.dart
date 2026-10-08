//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_label_recommendation_response_dto.g.dart';

/// AcceptLabelRecommendationResponseDto
///
/// Properties:
/// * [tagId] 
/// * [action] 
@BuiltValue()
abstract class AcceptLabelRecommendationResponseDto implements Built<AcceptLabelRecommendationResponseDto, AcceptLabelRecommendationResponseDtoBuilder> {
  @BuiltValueField(wireName: r'tagId')
  String get tagId;

  @BuiltValueField(wireName: r'action')
  String get action;

  AcceptLabelRecommendationResponseDto._();

  factory AcceptLabelRecommendationResponseDto([void updates(AcceptLabelRecommendationResponseDtoBuilder b)]) = _$AcceptLabelRecommendationResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptLabelRecommendationResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptLabelRecommendationResponseDto> get serializer => _$AcceptLabelRecommendationResponseDtoSerializer();
}

class _$AcceptLabelRecommendationResponseDtoSerializer implements PrimitiveSerializer<AcceptLabelRecommendationResponseDto> {
  @override
  final Iterable<Type> types = const [AcceptLabelRecommendationResponseDto, _$AcceptLabelRecommendationResponseDto];

  @override
  final String wireName = r'AcceptLabelRecommendationResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptLabelRecommendationResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'tagId';
    yield serializers.serialize(
      object.tagId,
      specifiedType: const FullType(String),
    );
    yield r'action';
    yield serializers.serialize(
      object.action,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptLabelRecommendationResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AcceptLabelRecommendationResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'tagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.tagId = valueDes;
          break;
        case r'action':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.action = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptLabelRecommendationResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptLabelRecommendationResponseDtoBuilder();
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

