//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'correspondent_list_response_dto.g.dart';

/// CorrespondentListResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class CorrespondentListResponseDto implements Built<CorrespondentListResponseDto, CorrespondentListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  CorrespondentListResponseDto._();

  factory CorrespondentListResponseDto([void updates(CorrespondentListResponseDtoBuilder b)]) = _$CorrespondentListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CorrespondentListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CorrespondentListResponseDto> get serializer => _$CorrespondentListResponseDtoSerializer();
}

class _$CorrespondentListResponseDtoSerializer implements PrimitiveSerializer<CorrespondentListResponseDto> {
  @override
  final Iterable<Type> types = const [CorrespondentListResponseDto, _$CorrespondentListResponseDto];

  @override
  final String wireName = r'CorrespondentListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CorrespondentListResponseDto object, {
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
    CorrespondentListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CorrespondentListResponseDtoBuilder result,
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
  CorrespondentListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CorrespondentListResponseDtoBuilder();
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

