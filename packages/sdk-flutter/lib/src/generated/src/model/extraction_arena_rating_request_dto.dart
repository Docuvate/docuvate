//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'extraction_arena_rating_request_dto.g.dart';

/// ExtractionArenaRatingRequestDto
///
/// Properties:
/// * [winnerEngine] 
/// * [comparedEngines] 
/// * [rating] 
/// * [applyAsDefault] 
@BuiltValue()
abstract class ExtractionArenaRatingRequestDto implements Built<ExtractionArenaRatingRequestDto, ExtractionArenaRatingRequestDtoBuilder> {
  @BuiltValueField(wireName: r'winnerEngine')
  String get winnerEngine;

  @BuiltValueField(wireName: r'comparedEngines')
  BuiltList<String> get comparedEngines;

  @BuiltValueField(wireName: r'rating')
  num? get rating;

  @BuiltValueField(wireName: r'applyAsDefault')
  bool? get applyAsDefault;

  ExtractionArenaRatingRequestDto._();

  factory ExtractionArenaRatingRequestDto([void updates(ExtractionArenaRatingRequestDtoBuilder b)]) = _$ExtractionArenaRatingRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExtractionArenaRatingRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExtractionArenaRatingRequestDto> get serializer => _$ExtractionArenaRatingRequestDtoSerializer();
}

class _$ExtractionArenaRatingRequestDtoSerializer implements PrimitiveSerializer<ExtractionArenaRatingRequestDto> {
  @override
  final Iterable<Type> types = const [ExtractionArenaRatingRequestDto, _$ExtractionArenaRatingRequestDto];

  @override
  final String wireName = r'ExtractionArenaRatingRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExtractionArenaRatingRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'winnerEngine';
    yield serializers.serialize(
      object.winnerEngine,
      specifiedType: const FullType(String),
    );
    yield r'comparedEngines';
    yield serializers.serialize(
      object.comparedEngines,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    if (object.rating != null) {
      yield r'rating';
      yield serializers.serialize(
        object.rating,
        specifiedType: const FullType(num),
      );
    }
    if (object.applyAsDefault != null) {
      yield r'applyAsDefault';
      yield serializers.serialize(
        object.applyAsDefault,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExtractionArenaRatingRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExtractionArenaRatingRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'winnerEngine':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.winnerEngine = valueDes;
          break;
        case r'comparedEngines':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.comparedEngines.replace(valueDes);
          break;
        case r'rating':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.rating = valueDes;
          break;
        case r'applyAsDefault':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.applyAsDefault = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExtractionArenaRatingRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExtractionArenaRatingRequestDtoBuilder();
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

