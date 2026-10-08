//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'propose_label_recommendation_blocklist_pattern_request_dto.g.dart';

/// ProposeLabelRecommendationBlocklistPatternRequestDto
///
/// Properties:
/// * [phrases] 
@BuiltValue()
abstract class ProposeLabelRecommendationBlocklistPatternRequestDto implements Built<ProposeLabelRecommendationBlocklistPatternRequestDto, ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder> {
  @BuiltValueField(wireName: r'phrases')
  BuiltList<String> get phrases;

  ProposeLabelRecommendationBlocklistPatternRequestDto._();

  factory ProposeLabelRecommendationBlocklistPatternRequestDto([void updates(ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder b)]) = _$ProposeLabelRecommendationBlocklistPatternRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ProposeLabelRecommendationBlocklistPatternRequestDto> get serializer => _$ProposeLabelRecommendationBlocklistPatternRequestDtoSerializer();
}

class _$ProposeLabelRecommendationBlocklistPatternRequestDtoSerializer implements PrimitiveSerializer<ProposeLabelRecommendationBlocklistPatternRequestDto> {
  @override
  final Iterable<Type> types = const [ProposeLabelRecommendationBlocklistPatternRequestDto, _$ProposeLabelRecommendationBlocklistPatternRequestDto];

  @override
  final String wireName = r'ProposeLabelRecommendationBlocklistPatternRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ProposeLabelRecommendationBlocklistPatternRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'phrases';
    yield serializers.serialize(
      object.phrases,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ProposeLabelRecommendationBlocklistPatternRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'phrases':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.phrases.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ProposeLabelRecommendationBlocklistPatternRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ProposeLabelRecommendationBlocklistPatternRequestDtoBuilder();
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

