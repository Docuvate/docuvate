//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'add_label_recommendation_blocklist_request_dto.g.dart';

/// AddLabelRecommendationBlocklistRequestDto
///
/// Properties:
/// * [phrase] 
@BuiltValue()
abstract class AddLabelRecommendationBlocklistRequestDto implements Built<AddLabelRecommendationBlocklistRequestDto, AddLabelRecommendationBlocklistRequestDtoBuilder> {
  @BuiltValueField(wireName: r'phrase')
  String get phrase;

  AddLabelRecommendationBlocklistRequestDto._();

  factory AddLabelRecommendationBlocklistRequestDto([void updates(AddLabelRecommendationBlocklistRequestDtoBuilder b)]) = _$AddLabelRecommendationBlocklistRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AddLabelRecommendationBlocklistRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AddLabelRecommendationBlocklistRequestDto> get serializer => _$AddLabelRecommendationBlocklistRequestDtoSerializer();
}

class _$AddLabelRecommendationBlocklistRequestDtoSerializer implements PrimitiveSerializer<AddLabelRecommendationBlocklistRequestDto> {
  @override
  final Iterable<Type> types = const [AddLabelRecommendationBlocklistRequestDto, _$AddLabelRecommendationBlocklistRequestDto];

  @override
  final String wireName = r'AddLabelRecommendationBlocklistRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AddLabelRecommendationBlocklistRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'phrase';
    yield serializers.serialize(
      object.phrase,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AddLabelRecommendationBlocklistRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AddLabelRecommendationBlocklistRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'phrase':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.phrase = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AddLabelRecommendationBlocklistRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AddLabelRecommendationBlocklistRequestDtoBuilder();
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

