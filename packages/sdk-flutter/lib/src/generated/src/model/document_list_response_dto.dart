//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_list_library_ui_dto.dart';
import 'package:built_value/json_object.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_list_response_dto.g.dart';

/// DocumentListResponseDto
///
/// Properties:
/// * [nextCursor] 
/// * [hasMore] 
/// * [total] - Total matching documents when `cursor` was omitted.
/// * [libraryUi] 
/// * [items] 
@BuiltValue()
abstract class DocumentListResponseDto implements Built<DocumentListResponseDto, DocumentListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'nextCursor')
  String get nextCursor;

  @BuiltValueField(wireName: r'hasMore')
  bool get hasMore;

  /// Total matching documents when `cursor` was omitted.
  @BuiltValueField(wireName: r'total')
  num get total;

  @BuiltValueField(wireName: r'libraryUi')
  DocumentListLibraryUiDto? get libraryUi;

  @BuiltValueField(wireName: r'items')
  BuiltList<JsonObject> get items;

  DocumentListResponseDto._();

  factory DocumentListResponseDto([void updates(DocumentListResponseDtoBuilder b)]) = _$DocumentListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentListResponseDto> get serializer => _$DocumentListResponseDtoSerializer();
}

class _$DocumentListResponseDtoSerializer implements PrimitiveSerializer<DocumentListResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentListResponseDto, _$DocumentListResponseDto];

  @override
  final String wireName = r'DocumentListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentListResponseDto object, {
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
    if (object.libraryUi != null) {
      yield r'libraryUi';
      yield serializers.serialize(
        object.libraryUi,
        specifiedType: const FullType(DocumentListLibraryUiDto),
      );
    }
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(JsonObject)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentListResponseDtoBuilder result,
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
        case r'libraryUi':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentListLibraryUiDto),
          ) as DocumentListLibraryUiDto;
          result.libraryUi.replace(valueDes);
          break;
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
  DocumentListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentListResponseDtoBuilder();
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

