//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'mappe_list_response_dto.g.dart';

/// MappeListResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class MappeListResponseDto implements Built<MappeListResponseDto, MappeListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  MappeListResponseDto._();

  factory MappeListResponseDto([void updates(MappeListResponseDtoBuilder b)]) = _$MappeListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MappeListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MappeListResponseDto> get serializer => _$MappeListResponseDtoSerializer();
}

class _$MappeListResponseDtoSerializer implements PrimitiveSerializer<MappeListResponseDto> {
  @override
  final Iterable<Type> types = const [MappeListResponseDto, _$MappeListResponseDto];

  @override
  final String wireName = r'MappeListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MappeListResponseDto object, {
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
    MappeListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MappeListResponseDtoBuilder result,
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
  MappeListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MappeListResponseDtoBuilder();
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

