//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'folder_list_response_dto.g.dart';

/// FolderListResponseDto
///
/// Properties:
/// * [items] 
@BuiltValue()
abstract class FolderListResponseDto implements Built<FolderListResponseDto, FolderListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  FolderListResponseDto._();

  factory FolderListResponseDto([void updates(FolderListResponseDtoBuilder b)]) = _$FolderListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FolderListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FolderListResponseDto> get serializer => _$FolderListResponseDtoSerializer();
}

class _$FolderListResponseDtoSerializer implements PrimitiveSerializer<FolderListResponseDto> {
  @override
  final Iterable<Type> types = const [FolderListResponseDto, _$FolderListResponseDto];

  @override
  final String wireName = r'FolderListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FolderListResponseDto object, {
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
    FolderListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FolderListResponseDtoBuilder result,
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
  FolderListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FolderListResponseDtoBuilder();
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

