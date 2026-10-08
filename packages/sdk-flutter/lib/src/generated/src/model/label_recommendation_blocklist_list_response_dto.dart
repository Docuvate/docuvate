//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'label_recommendation_blocklist_list_response_dto.g.dart';

/// LabelRecommendationBlocklistListResponseDto
///
/// Properties:
/// * [items] 
/// * [patterns] 
@BuiltValue()
abstract class LabelRecommendationBlocklistListResponseDto implements Built<LabelRecommendationBlocklistListResponseDto, LabelRecommendationBlocklistListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  @BuiltValueField(wireName: r'patterns')
  BuiltList<JsonObject> get patterns;

  LabelRecommendationBlocklistListResponseDto._();

  factory LabelRecommendationBlocklistListResponseDto([void updates(LabelRecommendationBlocklistListResponseDtoBuilder b)]) = _$LabelRecommendationBlocklistListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LabelRecommendationBlocklistListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LabelRecommendationBlocklistListResponseDto> get serializer => _$LabelRecommendationBlocklistListResponseDtoSerializer();
}

class _$LabelRecommendationBlocklistListResponseDtoSerializer implements PrimitiveSerializer<LabelRecommendationBlocklistListResponseDto> {
  @override
  final Iterable<Type> types = const [LabelRecommendationBlocklistListResponseDto, _$LabelRecommendationBlocklistListResponseDto];

  @override
  final String wireName = r'LabelRecommendationBlocklistListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LabelRecommendationBlocklistListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
    yield r'patterns';
    yield serializers.serialize(
      object.patterns,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LabelRecommendationBlocklistListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LabelRecommendationBlocklistListResponseDtoBuilder result,
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
        case r'patterns':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.patterns.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LabelRecommendationBlocklistListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LabelRecommendationBlocklistListResponseDtoBuilder();
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

