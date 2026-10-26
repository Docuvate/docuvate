//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'duplicate_set_list_response_dto_class.g.dart';

/// DuplicateSetListResponseDtoClass
///
/// Properties:
/// * [items] 
/// * [nextCursor] 
/// * [hasMore] 
/// * [total] 
@BuiltValue()
abstract class DuplicateSetListResponseDtoClass implements Built<DuplicateSetListResponseDtoClass, DuplicateSetListResponseDtoClassBuilder> {
  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  @BuiltValueField(wireName: r'nextCursor')
  String get nextCursor;

  @BuiltValueField(wireName: r'hasMore')
  bool get hasMore;

  @BuiltValueField(wireName: r'total')
  num get total;

  DuplicateSetListResponseDtoClass._();

  factory DuplicateSetListResponseDtoClass([void updates(DuplicateSetListResponseDtoClassBuilder b)]) = _$DuplicateSetListResponseDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DuplicateSetListResponseDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DuplicateSetListResponseDtoClass> get serializer => _$DuplicateSetListResponseDtoClassSerializer();
}

class _$DuplicateSetListResponseDtoClassSerializer implements PrimitiveSerializer<DuplicateSetListResponseDtoClass> {
  @override
  final Iterable<Type> types = const [DuplicateSetListResponseDtoClass, _$DuplicateSetListResponseDtoClass];

  @override
  final String wireName = r'DuplicateSetListResponseDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DuplicateSetListResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
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
    DuplicateSetListResponseDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DuplicateSetListResponseDtoClassBuilder result,
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
  DuplicateSetListResponseDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DuplicateSetListResponseDtoClassBuilder();
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

