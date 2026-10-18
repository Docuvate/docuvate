//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_list_response_dto.g.dart';

/// TagListResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class TagListResponseDto implements Built<TagListResponseDto, TagListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  TagListResponseDto._();

  factory TagListResponseDto([void updates(TagListResponseDtoBuilder b)]) = _$TagListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagListResponseDto> get serializer => _$TagListResponseDtoSerializer();
}

class _$TagListResponseDtoSerializer implements PrimitiveSerializer<TagListResponseDto> {
  @override
  final Iterable<Type> types = const [TagListResponseDto, _$TagListResponseDto];

  @override
  final String wireName = r'TagListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagListResponseDto object, {
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
    TagListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagListResponseDtoBuilder result,
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
  TagListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagListResponseDtoBuilder();
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

