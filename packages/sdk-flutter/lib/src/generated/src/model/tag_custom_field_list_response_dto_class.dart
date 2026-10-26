//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_custom_field_list_response_dto_class.g.dart';

/// TagCustomFieldListResponseDtoClass
///
/// Properties:
/// * [items] 
/// * [suggestions] 
@BuiltValue()
abstract class TagCustomFieldListResponseDtoClass implements Built<TagCustomFieldListResponseDtoClass, TagCustomFieldListResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  @BuiltValueField(wireName: r'suggestions')
  BuiltList<JsonObject>? get suggestions;

  TagCustomFieldListResponseDtoClass._();

  factory TagCustomFieldListResponseDtoClass([void updates(TagCustomFieldListResponseDtoClassBuilder b)]) = _$TagCustomFieldListResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TagCustomFieldListResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TagCustomFieldListResponseDtoClass> get serializer => _$TagCustomFieldListResponseDtoClassSerializer();
}

class _$TagCustomFieldListResponseDtoClassSerializer implements PrimitiveSerializer<TagCustomFieldListResponseDtoClass> {
  @override
  final Iterable<Type> types = const [TagCustomFieldListResponseDtoClass, _$TagCustomFieldListResponseDtoClass];

  @override
  final String wireName = r'TagCustomFieldListResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TagCustomFieldListResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
    if (object.suggestions != null) {
      yield r'suggestions';
      yield serializers.serialize(
        object.suggestions,
        specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    TagCustomFieldListResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TagCustomFieldListResponseDtoClassBuilder result,
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
        case r'suggestions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
          ) as BuiltList<JsonObject>;
          result.suggestions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TagCustomFieldListResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TagCustomFieldListResponseDtoClassBuilder();
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

