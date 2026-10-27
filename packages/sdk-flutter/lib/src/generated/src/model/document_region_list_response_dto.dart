//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_region_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_region_list_response_dto.g.dart';

/// DocumentRegionListResponseDto
///
/// Properties:
/// * [irSha256] 
/// * [items] 
@BuiltValue()
abstract class DocumentRegionListResponseDto implements Built<DocumentRegionListResponseDto, DocumentRegionListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'irSha256')
  String get irSha256;

  @BuiltValueField(wireName: r'items')
  BuiltList<DocumentRegionDto> get items;

  DocumentRegionListResponseDto._();

  factory DocumentRegionListResponseDto([void updates(DocumentRegionListResponseDtoBuilder b)]) = _$DocumentRegionListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentRegionListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentRegionListResponseDto> get serializer => _$DocumentRegionListResponseDtoSerializer();
}

class _$DocumentRegionListResponseDtoSerializer implements PrimitiveSerializer<DocumentRegionListResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentRegionListResponseDto, _$DocumentRegionListResponseDto];

  @override
  final String wireName = r'DocumentRegionListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentRegionListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'irSha256';
    yield serializers.serialize(
      object.irSha256,
      specifiedType: const FullType(String),
    );
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(DocumentRegionDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentRegionListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentRegionListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'irSha256':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.irSha256 = valueDes;
          break;
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentRegionDto)]),
          ) as BuiltList<DocumentRegionDto>;
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
  DocumentRegionListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentRegionListResponseDtoBuilder();
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

