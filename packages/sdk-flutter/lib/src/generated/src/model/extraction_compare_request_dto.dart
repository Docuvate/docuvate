//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'extraction_compare_request_dto.g.dart';

/// ExtractionCompareRequestDto
///
/// Properties:
/// * [engines] 
/// * [maxPages] 
@BuiltValue()
abstract class ExtractionCompareRequestDto implements Built<ExtractionCompareRequestDto, ExtractionCompareRequestDtoBuilder> {
  @BuiltValueField(wireName: r'engines')
  BuiltList<String>? get engines;

  @BuiltValueField(wireName: r'maxPages')
  num? get maxPages;

  ExtractionCompareRequestDto._();

  factory ExtractionCompareRequestDto([void updates(ExtractionCompareRequestDtoBuilder b)]) = _$ExtractionCompareRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExtractionCompareRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExtractionCompareRequestDto> get serializer => _$ExtractionCompareRequestDtoSerializer();
}

class _$ExtractionCompareRequestDtoSerializer implements PrimitiveSerializer<ExtractionCompareRequestDto> {
  @override
  final Iterable<Type> types = const [ExtractionCompareRequestDto, _$ExtractionCompareRequestDto];

  @override
  final String wireName = r'ExtractionCompareRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExtractionCompareRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.engines != null) {
      yield r'engines';
      yield serializers.serialize(
        object.engines,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.maxPages != null) {
      yield r'maxPages';
      yield serializers.serialize(
        object.maxPages,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExtractionCompareRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExtractionCompareRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'engines':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.engines.replace(valueDes);
          break;
        case r'maxPages':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.maxPages = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExtractionCompareRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExtractionCompareRequestDtoBuilder();
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

