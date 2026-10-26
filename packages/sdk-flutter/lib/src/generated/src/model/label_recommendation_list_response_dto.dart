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
/// * [state] 
@BuiltValue()
abstract class LabelRecommendationListResponseDto implements Built<LabelRecommendationListResponseDto, LabelRecommendationListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  @BuiltValueField(wireName: r'state')
  LabelRecommendationListResponseDtoStateEnum get state;
  // enum stateEnum {  ready,  warming,  };

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
    yield r'state';
    yield serializers.serialize(
      object.state,
      specifiedType: const FullType(LabelRecommendationListResponseDtoStateEnum),
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
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LabelRecommendationListResponseDtoStateEnum),
          ) as LabelRecommendationListResponseDtoStateEnum;
          result.state = valueDes;
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

class LabelRecommendationListResponseDtoStateEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ready')
  static const LabelRecommendationListResponseDtoStateEnum ready = _$labelRecommendationListResponseDtoStateEnum_ready;
  @BuiltValueEnumConst(wireName: r'warming')
  static const LabelRecommendationListResponseDtoStateEnum warming = _$labelRecommendationListResponseDtoStateEnum_warming;

  static Serializer<LabelRecommendationListResponseDtoStateEnum> get serializer => _$labelRecommendationListResponseDtoStateEnumSerializer;

  const LabelRecommendationListResponseDtoStateEnum._(String name): super(name);

  static BuiltSet<LabelRecommendationListResponseDtoStateEnum> get values => _$labelRecommendationListResponseDtoStateEnumValues;
  static LabelRecommendationListResponseDtoStateEnum valueOf(String name) => _$labelRecommendationListResponseDtoStateEnumValueOf(name);
}

