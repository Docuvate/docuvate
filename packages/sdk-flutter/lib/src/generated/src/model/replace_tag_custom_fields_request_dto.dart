//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/replace_tag_custom_field_item_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'replace_tag_custom_fields_request_dto.g.dart';

/// ReplaceTagCustomFieldsRequestDto
///
/// Properties:
/// * [fields] 
@BuiltValue()
abstract class ReplaceTagCustomFieldsRequestDto implements Built<ReplaceTagCustomFieldsRequestDto, ReplaceTagCustomFieldsRequestDtoBuilder> {
  @BuiltValueField(wireName: r'fields')
  BuiltList<ReplaceTagCustomFieldItemDto> get fields;

  ReplaceTagCustomFieldsRequestDto._();

  factory ReplaceTagCustomFieldsRequestDto([void updates(ReplaceTagCustomFieldsRequestDtoBuilder b)]) = _$ReplaceTagCustomFieldsRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ReplaceTagCustomFieldsRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ReplaceTagCustomFieldsRequestDto> get serializer => _$ReplaceTagCustomFieldsRequestDtoSerializer();
}

class _$ReplaceTagCustomFieldsRequestDtoSerializer implements PrimitiveSerializer<ReplaceTagCustomFieldsRequestDto> {
  @override
  final Iterable<Type> types = const [ReplaceTagCustomFieldsRequestDto, _$ReplaceTagCustomFieldsRequestDto];

  @override
  final String wireName = r'ReplaceTagCustomFieldsRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ReplaceTagCustomFieldsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'fields';
    yield serializers.serialize(
      object.fields,
      specifiedType: const FullType(BuiltList, [FullType(ReplaceTagCustomFieldItemDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ReplaceTagCustomFieldsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ReplaceTagCustomFieldsRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'fields':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ReplaceTagCustomFieldItemDto)]),
          ) as BuiltList<ReplaceTagCustomFieldItemDto>;
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
  ReplaceTagCustomFieldsRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ReplaceTagCustomFieldsRequestDtoBuilder();
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

