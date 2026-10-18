//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'confirm_label_recommendation_blocklist_pattern_request_dto.g.dart';

/// ConfirmLabelRecommendationBlocklistPatternRequestDto
///
/// Properties:
/// * [pattern] 
@BuiltValue()
abstract class ConfirmLabelRecommendationBlocklistPatternRequestDto implements Built<ConfirmLabelRecommendationBlocklistPatternRequestDto, ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder> {
  @BuiltValueField(wireName: r'pattern')
  String get pattern;

  ConfirmLabelRecommendationBlocklistPatternRequestDto._();

  factory ConfirmLabelRecommendationBlocklistPatternRequestDto([void updates(ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder b)]) = _$ConfirmLabelRecommendationBlocklistPatternRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ConfirmLabelRecommendationBlocklistPatternRequestDto> get serializer => _$ConfirmLabelRecommendationBlocklistPatternRequestDtoSerializer();
}

class _$ConfirmLabelRecommendationBlocklistPatternRequestDtoSerializer implements PrimitiveSerializer<ConfirmLabelRecommendationBlocklistPatternRequestDto> {
  @override
  final Iterable<Type> types = const [ConfirmLabelRecommendationBlocklistPatternRequestDto, _$ConfirmLabelRecommendationBlocklistPatternRequestDto];

  @override
  final String wireName = r'ConfirmLabelRecommendationBlocklistPatternRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ConfirmLabelRecommendationBlocklistPatternRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'pattern';
    yield serializers.serialize(
      object.pattern,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ConfirmLabelRecommendationBlocklistPatternRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'pattern':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.pattern = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ConfirmLabelRecommendationBlocklistPatternRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ConfirmLabelRecommendationBlocklistPatternRequestDtoBuilder();
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

