//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_providers_catalog_meta_dto.g.dart';

/// DocumentChatProvidersCatalogMetaDto
///
/// Properties:
/// * [ollamaModel] 
/// * [ollamaConfigured] 
/// * [runsOnCpu] 
@BuiltValue()
abstract class DocumentChatProvidersCatalogMetaDto implements Built<DocumentChatProvidersCatalogMetaDto, DocumentChatProvidersCatalogMetaDtoBuilder> {
  @BuiltValueField(wireName: r'ollamaModel')
  String get ollamaModel;

  @BuiltValueField(wireName: r'ollamaConfigured')
  bool get ollamaConfigured;

  @BuiltValueField(wireName: r'runsOnCpu')
  bool get runsOnCpu;

  DocumentChatProvidersCatalogMetaDto._();

  factory DocumentChatProvidersCatalogMetaDto([void updates(DocumentChatProvidersCatalogMetaDtoBuilder b)]) = _$DocumentChatProvidersCatalogMetaDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatProvidersCatalogMetaDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatProvidersCatalogMetaDto> get serializer => _$DocumentChatProvidersCatalogMetaDtoSerializer();
}

class _$DocumentChatProvidersCatalogMetaDtoSerializer implements PrimitiveSerializer<DocumentChatProvidersCatalogMetaDto> {
  @override
  final Iterable<Type> types = const [DocumentChatProvidersCatalogMetaDto, _$DocumentChatProvidersCatalogMetaDto];

  @override
  final String wireName = r'DocumentChatProvidersCatalogMetaDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatProvidersCatalogMetaDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'ollamaModel';
    yield serializers.serialize(
      object.ollamaModel,
      specifiedType: const FullType(String),
    );
    yield r'ollamaConfigured';
    yield serializers.serialize(
      object.ollamaConfigured,
      specifiedType: const FullType(bool),
    );
    yield r'runsOnCpu';
    yield serializers.serialize(
      object.runsOnCpu,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatProvidersCatalogMetaDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatProvidersCatalogMetaDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'ollamaModel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.ollamaModel = valueDes;
          break;
        case r'ollamaConfigured':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.ollamaConfigured = valueDes;
          break;
        case r'runsOnCpu':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.runsOnCpu = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatProvidersCatalogMetaDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatProvidersCatalogMetaDtoBuilder();
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

