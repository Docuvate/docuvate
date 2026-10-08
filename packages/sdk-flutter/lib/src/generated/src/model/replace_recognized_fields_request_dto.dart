//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/replace_recognized_field_item_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_recognized_fields_request_dto.g.dart';

/// ReplaceRecognizedFieldsRequestDto
///
/// Properties:
/// * [fields] 
@BuiltValue()
abstract class ReplaceRecognizedFieldsRequestDto implements Built<ReplaceRecognizedFieldsRequestDto, ReplaceRecognizedFieldsRequestDtoBuilder> {
  @BuiltValueField(wireName: r'fields')
  BuiltList<ReplaceRecognizedFieldItemDto> get fields;

  ReplaceRecognizedFieldsRequestDto._();

  factory ReplaceRecognizedFieldsRequestDto([void updates(ReplaceRecognizedFieldsRequestDtoBuilder b)]) = _$ReplaceRecognizedFieldsRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceRecognizedFieldsRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceRecognizedFieldsRequestDto> get serializer => _$ReplaceRecognizedFieldsRequestDtoSerializer();
}

class _$ReplaceRecognizedFieldsRequestDtoSerializer implements PrimitiveSerializer<ReplaceRecognizedFieldsRequestDto> {
  @override
  final Iterable<Type> types = const [ReplaceRecognizedFieldsRequestDto, _$ReplaceRecognizedFieldsRequestDto];

  @override
  final String wireName = r'ReplaceRecognizedFieldsRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceRecognizedFieldsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fields';
    yield serializers.serialize(
      object.fields,
      specifiedType: const FullType(BuiltList, [FullType(ReplaceRecognizedFieldItemDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceRecognizedFieldsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReplaceRecognizedFieldsRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fields':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ReplaceRecognizedFieldItemDto)]),
          ) as BuiltList<ReplaceRecognizedFieldItemDto>;
          result.fields.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ReplaceRecognizedFieldsRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceRecognizedFieldsRequestDtoBuilder();
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

