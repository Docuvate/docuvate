//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'extraction_engine_list_response_dto.g.dart';

/// ExtractionEngineListResponseDto
///
/// Properties:
/// * [engines] 
@BuiltValue()
abstract class ExtractionEngineListResponseDto implements Built<ExtractionEngineListResponseDto, ExtractionEngineListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'engines')
  BuiltList<JsonObject> get engines;

  ExtractionEngineListResponseDto._();

  factory ExtractionEngineListResponseDto([void updates(ExtractionEngineListResponseDtoBuilder b)]) = _$ExtractionEngineListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExtractionEngineListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExtractionEngineListResponseDto> get serializer => _$ExtractionEngineListResponseDtoSerializer();
}

class _$ExtractionEngineListResponseDtoSerializer implements PrimitiveSerializer<ExtractionEngineListResponseDto> {
  @override
  final Iterable<Type> types = const [ExtractionEngineListResponseDto, _$ExtractionEngineListResponseDto];

  @override
  final String wireName = r'ExtractionEngineListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExtractionEngineListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'engines';
    yield serializers.serialize(
      object.engines,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ExtractionEngineListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExtractionEngineListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'engines':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.engines.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExtractionEngineListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExtractionEngineListResponseDtoBuilder();
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

