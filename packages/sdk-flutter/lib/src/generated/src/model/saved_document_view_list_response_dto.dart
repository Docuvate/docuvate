//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/saved_document_view_dto_class.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'saved_document_view_list_response_dto.g.dart';

/// SavedDocumentViewListResponseDto
///
/// Properties:
/// * [nextCursor] 
/// * [hasMore] 
/// * [total] 
/// * [items] 
@BuiltValue()
abstract class SavedDocumentViewListResponseDto implements Built<SavedDocumentViewListResponseDto, SavedDocumentViewListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'nextCursor')
  String get nextCursor;

  @BuiltValueField(wireName: r'hasMore')
  bool get hasMore;

  @BuiltValueField(wireName: r'total')
  num get total;

  @BuiltValueField(wireName: r'items')
  BuiltList<SavedDocumentViewDtoClass> get items;

  SavedDocumentViewListResponseDto._();

  factory SavedDocumentViewListResponseDto([void updates(SavedDocumentViewListResponseDtoBuilder b)]) = _$SavedDocumentViewListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SavedDocumentViewListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SavedDocumentViewListResponseDto> get serializer => _$SavedDocumentViewListResponseDtoSerializer();
}

class _$SavedDocumentViewListResponseDtoSerializer implements PrimitiveSerializer<SavedDocumentViewListResponseDto> {
  @override
  final Iterable<Type> types = const [SavedDocumentViewListResponseDto, _$SavedDocumentViewListResponseDto];

  @override
  final String wireName = r'SavedDocumentViewListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SavedDocumentViewListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(SavedDocumentViewDtoClass)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SavedDocumentViewListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SavedDocumentViewListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(SavedDocumentViewDtoClass)]),
          ) as BuiltList<SavedDocumentViewDtoClass>;
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
  SavedDocumentViewListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SavedDocumentViewListResponseDtoBuilder();
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

