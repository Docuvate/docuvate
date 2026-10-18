//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dismiss_label_recommendation_request_dto.g.dart';

/// DismissLabelRecommendationRequestDto
///
/// Properties:
/// * [phrase] 
/// * [phrases] 
/// * [blockFuture] 
@BuiltValue()
abstract class DismissLabelRecommendationRequestDto implements Built<DismissLabelRecommendationRequestDto, DismissLabelRecommendationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'phrase')
  String? get phrase;

  @BuiltValueField(wireName: r'phrases')
  BuiltList<String>? get phrases;

  @BuiltValueField(wireName: r'blockFuture')
  bool? get blockFuture;

  DismissLabelRecommendationRequestDto._();

  factory DismissLabelRecommendationRequestDto([void updates(DismissLabelRecommendationRequestDtoBuilder b)]) = _$DismissLabelRecommendationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DismissLabelRecommendationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DismissLabelRecommendationRequestDto> get serializer => _$DismissLabelRecommendationRequestDtoSerializer();
}

class _$DismissLabelRecommendationRequestDtoSerializer implements PrimitiveSerializer<DismissLabelRecommendationRequestDto> {
  @override
  final Iterable<Type> types = const [DismissLabelRecommendationRequestDto, _$DismissLabelRecommendationRequestDto];

  @override
  final String wireName = r'DismissLabelRecommendationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DismissLabelRecommendationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.phrase != null) {
      yield r'phrase';
      yield serializers.serialize(
        object.phrase,
        specifiedType: const FullType(String),
      );
    }
    if (object.phrases != null) {
      yield r'phrases';
      yield serializers.serialize(
        object.phrases,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.blockFuture != null) {
      yield r'blockFuture';
      yield serializers.serialize(
        object.blockFuture,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DismissLabelRecommendationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DismissLabelRecommendationRequestDtoBuilder result,
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
        case r'phrases':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.phrases.replace(valueDes);
          break;
        case r'blockFuture':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.blockFuture = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DismissLabelRecommendationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DismissLabelRecommendationRequestDtoBuilder();
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

