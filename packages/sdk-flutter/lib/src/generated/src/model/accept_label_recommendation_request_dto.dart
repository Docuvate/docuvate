//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'accept_label_recommendation_request_dto.g.dart';

/// AcceptLabelRecommendationRequestDto
///
/// Properties:
/// * [recommendationId] 
/// * [proposedName] 
/// * [tagId] 
/// * [keepTagId] 
/// * [removeTagId] 
/// * [color] 
@BuiltValue()
abstract class AcceptLabelRecommendationRequestDto implements Built<AcceptLabelRecommendationRequestDto, AcceptLabelRecommendationRequestDtoBuilder> {
  @BuiltValueField(wireName: r'recommendationId')
  String? get recommendationId;

  @BuiltValueField(wireName: r'proposedName')
  String? get proposedName;

  @BuiltValueField(wireName: r'tagId')
  String? get tagId;

  @BuiltValueField(wireName: r'keepTagId')
  String? get keepTagId;

  @BuiltValueField(wireName: r'removeTagId')
  String? get removeTagId;

  @BuiltValueField(wireName: r'color')
  String? get color;

  AcceptLabelRecommendationRequestDto._();

  factory AcceptLabelRecommendationRequestDto([void updates(AcceptLabelRecommendationRequestDtoBuilder b)]) = _$AcceptLabelRecommendationRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AcceptLabelRecommendationRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AcceptLabelRecommendationRequestDto> get serializer => _$AcceptLabelRecommendationRequestDtoSerializer();
}

class _$AcceptLabelRecommendationRequestDtoSerializer implements PrimitiveSerializer<AcceptLabelRecommendationRequestDto> {
  @override
  final Iterable<Type> types = const [AcceptLabelRecommendationRequestDto, _$AcceptLabelRecommendationRequestDto];

  @override
  final String wireName = r'AcceptLabelRecommendationRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AcceptLabelRecommendationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.recommendationId != null) {
      yield r'recommendationId';
      yield serializers.serialize(
        object.recommendationId,
        specifiedType: const FullType(String),
      );
    }
    if (object.proposedName != null) {
      yield r'proposedName';
      yield serializers.serialize(
        object.proposedName,
        specifiedType: const FullType(String),
      );
    }
    if (object.tagId != null) {
      yield r'tagId';
      yield serializers.serialize(
        object.tagId,
        specifiedType: const FullType(String),
      );
    }
    if (object.keepTagId != null) {
      yield r'keepTagId';
      yield serializers.serialize(
        object.keepTagId,
        specifiedType: const FullType(String),
      );
    }
    if (object.removeTagId != null) {
      yield r'removeTagId';
      yield serializers.serialize(
        object.removeTagId,
        specifiedType: const FullType(String),
      );
    }
    if (object.color != null) {
      yield r'color';
      yield serializers.serialize(
        object.color,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AcceptLabelRecommendationRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AcceptLabelRecommendationRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'recommendationId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.recommendationId = valueDes;
          break;
        case r'proposedName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.proposedName = valueDes;
          break;
        case r'tagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.tagId = valueDes;
          break;
        case r'keepTagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.keepTagId = valueDes;
          break;
        case r'removeTagId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.removeTagId = valueDes;
          break;
        case r'color':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.color = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AcceptLabelRecommendationRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AcceptLabelRecommendationRequestDtoBuilder();
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

