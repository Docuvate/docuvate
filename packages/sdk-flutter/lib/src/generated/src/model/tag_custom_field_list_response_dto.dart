//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_custom_field_list_response_dto.g.dart';

/// TagCustomFieldListResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class TagCustomFieldListResponseDto implements Built<TagCustomFieldListResponseDto, TagCustomFieldListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  TagCustomFieldListResponseDto._();

  factory TagCustomFieldListResponseDto([void updates(TagCustomFieldListResponseDtoBuilder b)]) = _$TagCustomFieldListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagCustomFieldListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagCustomFieldListResponseDto> get serializer => _$TagCustomFieldListResponseDtoSerializer();
}

class _$TagCustomFieldListResponseDtoSerializer implements PrimitiveSerializer<TagCustomFieldListResponseDto> {
  @override
  final Iterable<Type> types = const [TagCustomFieldListResponseDto, _$TagCustomFieldListResponseDto];

  @override
  final String wireName = r'TagCustomFieldListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagCustomFieldListResponseDto object, {
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
    TagCustomFieldListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagCustomFieldListResponseDtoBuilder result,
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
  TagCustomFieldListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagCustomFieldListResponseDtoBuilder();
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

