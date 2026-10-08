//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/document_chat_unavailable_backend_info_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/document_chat_providers_catalog_meta_dto.dart';
import 'package:docuvate/src/generated/src/model/document_chat_provider_info_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_provider_list_response_dto.g.dart';

/// DocumentChatProviderListResponseDto
///
/// Properties:
/// * [selectable] 
/// * [unavailable] 
/// * [development] 
/// * [meta] 
@BuiltValue()
abstract class DocumentChatProviderListResponseDto implements Built<DocumentChatProviderListResponseDto, DocumentChatProviderListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'selectable')
  BuiltList<DocumentChatProviderInfoDto> get selectable;

  @BuiltValueField(wireName: r'unavailable')
  BuiltList<DocumentChatUnavailableBackendInfoDto> get unavailable;

  @BuiltValueField(wireName: r'development')
  BuiltList<DocumentChatProviderInfoDto>? get development;

  @BuiltValueField(wireName: r'meta')
  DocumentChatProvidersCatalogMetaDto get meta;

  DocumentChatProviderListResponseDto._();

  factory DocumentChatProviderListResponseDto([void updates(DocumentChatProviderListResponseDtoBuilder b)]) = _$DocumentChatProviderListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatProviderListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatProviderListResponseDto> get serializer => _$DocumentChatProviderListResponseDtoSerializer();
}

class _$DocumentChatProviderListResponseDtoSerializer implements PrimitiveSerializer<DocumentChatProviderListResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentChatProviderListResponseDto, _$DocumentChatProviderListResponseDto];

  @override
  final String wireName = r'DocumentChatProviderListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatProviderListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'selectable';
    yield serializers.serialize(
      object.selectable,
      specifiedType: const FullType(BuiltList, [FullType(DocumentChatProviderInfoDto)]),
    );
    yield r'unavailable';
    yield serializers.serialize(
      object.unavailable,
      specifiedType: const FullType(BuiltList, [FullType(DocumentChatUnavailableBackendInfoDto)]),
    );
    if (object.development != null) {
      yield r'development';
      yield serializers.serialize(
        object.development,
        specifiedType: const FullType(BuiltList, [FullType(DocumentChatProviderInfoDto)]),
      );
    }
    yield r'meta';
    yield serializers.serialize(
      object.meta,
      specifiedType: const FullType(DocumentChatProvidersCatalogMetaDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatProviderListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatProviderListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'selectable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentChatProviderInfoDto)]),
          ) as BuiltList<DocumentChatProviderInfoDto>;
          result.selectable.replace(valueDes);
          break;
        case r'unavailable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentChatUnavailableBackendInfoDto)]),
          ) as BuiltList<DocumentChatUnavailableBackendInfoDto>;
          result.unavailable.replace(valueDes);
          break;
        case r'development':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(DocumentChatProviderInfoDto)]),
          ) as BuiltList<DocumentChatProviderInfoDto>;
          result.development.replace(valueDes);
          break;
        case r'meta':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentChatProvidersCatalogMetaDto),
          ) as DocumentChatProvidersCatalogMetaDto;
          result.meta.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatProviderListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatProviderListResponseDtoBuilder();
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

