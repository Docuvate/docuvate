//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recognized_field_filter_values_response_dto.g.dart';

/// RecognizedFieldFilterValuesResponseDto
///
/// Properties:
/// * [items] 
/// * [nextCursor] 
/// * [hasMore] 
/// * [total] 
@BuiltValue()
abstract class RecognizedFieldFilterValuesResponseDto implements Built<RecognizedFieldFilterValuesResponseDto, RecognizedFieldFilterValuesResponseDtoBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<String> get items;

  @BuiltValueField(wireName: r'nextCursor')
  String get nextCursor;

  @BuiltValueField(wireName: r'hasMore')
  bool get hasMore;

  @BuiltValueField(wireName: r'total')
  num get total;

  RecognizedFieldFilterValuesResponseDto._();

  factory RecognizedFieldFilterValuesResponseDto([void updates(RecognizedFieldFilterValuesResponseDtoBuilder b)]) = _$RecognizedFieldFilterValuesResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecognizedFieldFilterValuesResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecognizedFieldFilterValuesResponseDto> get serializer => _$RecognizedFieldFilterValuesResponseDtoSerializer();
}

class _$RecognizedFieldFilterValuesResponseDtoSerializer implements PrimitiveSerializer<RecognizedFieldFilterValuesResponseDto> {
  @override
  final Iterable<Type> types = const [RecognizedFieldFilterValuesResponseDto, _$RecognizedFieldFilterValuesResponseDto];

  @override
  final String wireName = r'RecognizedFieldFilterValuesResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecognizedFieldFilterValuesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'nextCursor';
    yield serializers.serialize(
      object.nextCursor,
      specifiedType: const FullType(String),
    );
    yield r'hasMore';
    yield serializers.serialize(
      object.hasMore,
      specifiedType: const FullType(bool),
    );
    yield r'total';
    yield serializers.serialize(
      object.total,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RecognizedFieldFilterValuesResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecognizedFieldFilterValuesResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.items.replace(valueDes);
          break;
        case r'nextCursor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.nextCursor = valueDes;
          break;
        case r'hasMore':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasMore = valueDes;
          break;
        case r'total':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.total = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RecognizedFieldFilterValuesResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecognizedFieldFilterValuesResponseDtoBuilder();
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

