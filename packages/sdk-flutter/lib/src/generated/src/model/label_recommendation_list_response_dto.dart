//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'label_recommendation_list_response_dto.g.dart';

/// LabelRecommendationListResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class LabelRecommendationListResponseDto implements Built<LabelRecommendationListResponseDto, LabelRecommendationListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  LabelRecommendationListResponseDto._();

  factory LabelRecommendationListResponseDto([void updates(LabelRecommendationListResponseDtoBuilder b)]) = _$LabelRecommendationListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LabelRecommendationListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LabelRecommendationListResponseDto> get serializer => _$LabelRecommendationListResponseDtoSerializer();
}

class _$LabelRecommendationListResponseDtoSerializer implements PrimitiveSerializer<LabelRecommendationListResponseDto> {
  @override
  final Iterable<Type> types = const [LabelRecommendationListResponseDto, _$LabelRecommendationListResponseDto];

  @override
  final String wireName = r'LabelRecommendationListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LabelRecommendationListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LabelRecommendationListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LabelRecommendationListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LabelRecommendationListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LabelRecommendationListResponseDtoBuilder();
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

