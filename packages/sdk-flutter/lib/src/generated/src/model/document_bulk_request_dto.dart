//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_bulk_action_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_bulk_request_dto.g.dart';

/// DocumentBulkRequestDto
///
/// Properties:
/// * [ids] 
/// * [bulk] 
@BuiltValue()
abstract class DocumentBulkRequestDto implements Built<DocumentBulkRequestDto, DocumentBulkRequestDtoBuilder> {
  @BuiltValueField(wireName: r'ids')
  BuiltList<String> get ids;

  @BuiltValueField(wireName: r'bulk')
  DocumentBulkActionDto get bulk;

  DocumentBulkRequestDto._();

  factory DocumentBulkRequestDto([void updates(DocumentBulkRequestDtoBuilder b)]) = _$DocumentBulkRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentBulkRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentBulkRequestDto> get serializer => _$DocumentBulkRequestDtoSerializer();
}

class _$DocumentBulkRequestDtoSerializer implements PrimitiveSerializer<DocumentBulkRequestDto> {
  @override
  final Iterable<Type> types = const [DocumentBulkRequestDto, _$DocumentBulkRequestDto];

  @override
  final String wireName = r'DocumentBulkRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentBulkRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ids';
    yield serializers.serialize(
      object.ids,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'bulk';
    yield serializers.serialize(
      object.bulk,
      specifiedType: const FullType(DocumentBulkActionDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentBulkRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentBulkRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ids':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.ids.replace(valueDes);
          break;
        case r'bulk':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentBulkActionDto),
          ) as DocumentBulkActionDto;
          result.bulk.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentBulkRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentBulkRequestDtoBuilder();
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

