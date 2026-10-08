//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_thread_dto.g.dart';

/// DocumentChatThreadDto
///
/// Properties:
/// * [id] 
/// * [title] 
/// * [scope] 
/// * [documentIds] 
/// * [createdAt] 
/// * [updatedAt] 
/// * [lastMessagePreview] 
/// * [activeGenerationStatus] 
@BuiltValue()
abstract class DocumentChatThreadDto implements Built<DocumentChatThreadDto, DocumentChatThreadDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'title')
  String get title;

  @BuiltValueField(wireName: r'scope')
  DocumentChatThreadDtoScopeEnum get scope;
  // enum scopeEnum {  document,  corpus,  };

  @BuiltValueField(wireName: r'documentIds')
  BuiltList<String> get documentIds;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String get updatedAt;

  @BuiltValueField(wireName: r'lastMessagePreview')
  String? get lastMessagePreview;

  @BuiltValueField(wireName: r'activeGenerationStatus')
  DocumentChatThreadDtoActiveGenerationStatusEnum? get activeGenerationStatus;
  // enum activeGenerationStatusEnum {  failed,  pending,  streaming,  done,  };

  DocumentChatThreadDto._();

  factory DocumentChatThreadDto([void updates(DocumentChatThreadDtoBuilder b)]) = _$DocumentChatThreadDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatThreadDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatThreadDto> get serializer => _$DocumentChatThreadDtoSerializer();
}

class _$DocumentChatThreadDtoSerializer implements PrimitiveSerializer<DocumentChatThreadDto> {
  @override
  final Iterable<Type> types = const [DocumentChatThreadDto, _$DocumentChatThreadDto];

  @override
  final String wireName = r'DocumentChatThreadDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatThreadDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'title';
    yield serializers.serialize(
      object.title,
      specifiedType: const FullType(String),
    );
    yield r'scope';
    yield serializers.serialize(
      object.scope,
      specifiedType: const FullType(DocumentChatThreadDtoScopeEnum),
    );
    yield r'documentIds';
    yield serializers.serialize(
      object.documentIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(String),
    );
    if (object.lastMessagePreview != null) {
      yield r'lastMessagePreview';
      yield serializers.serialize(
        object.lastMessagePreview,
        specifiedType: const FullType(String),
      );
    }
    if (object.activeGenerationStatus != null) {
      yield r'activeGenerationStatus';
      yield serializers.serialize(
        object.activeGenerationStatus,
        specifiedType: const FullType(DocumentChatThreadDtoActiveGenerationStatusEnum),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatThreadDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatThreadDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'title':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.title = valueDes;
          break;
        case r'scope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentChatThreadDtoScopeEnum),
          ) as DocumentChatThreadDtoScopeEnum;
          result.scope = valueDes;
          break;
        case r'documentIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.documentIds.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'lastMessagePreview':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lastMessagePreview = valueDes;
          break;
        case r'activeGenerationStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DocumentChatThreadDtoActiveGenerationStatusEnum),
          ) as DocumentChatThreadDtoActiveGenerationStatusEnum;
          result.activeGenerationStatus = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatThreadDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatThreadDtoBuilder();
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

class DocumentChatThreadDtoScopeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'document')
  static const DocumentChatThreadDtoScopeEnum document = _$documentChatThreadDtoScopeEnum_document;
  @BuiltValueEnumConst(wireName: r'corpus')
  static const DocumentChatThreadDtoScopeEnum corpus = _$documentChatThreadDtoScopeEnum_corpus;

  static Serializer<DocumentChatThreadDtoScopeEnum> get serializer => _$documentChatThreadDtoScopeEnumSerializer;

  const DocumentChatThreadDtoScopeEnum._(String name): super(name);

  static BuiltSet<DocumentChatThreadDtoScopeEnum> get values => _$documentChatThreadDtoScopeEnumValues;
  static DocumentChatThreadDtoScopeEnum valueOf(String name) => _$documentChatThreadDtoScopeEnumValueOf(name);
}

class DocumentChatThreadDtoActiveGenerationStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'failed')
  static const DocumentChatThreadDtoActiveGenerationStatusEnum failed = _$documentChatThreadDtoActiveGenerationStatusEnum_failed;
  @BuiltValueEnumConst(wireName: r'pending')
  static const DocumentChatThreadDtoActiveGenerationStatusEnum pending = _$documentChatThreadDtoActiveGenerationStatusEnum_pending;
  @BuiltValueEnumConst(wireName: r'streaming')
  static const DocumentChatThreadDtoActiveGenerationStatusEnum streaming = _$documentChatThreadDtoActiveGenerationStatusEnum_streaming;
  @BuiltValueEnumConst(wireName: r'done')
  static const DocumentChatThreadDtoActiveGenerationStatusEnum done = _$documentChatThreadDtoActiveGenerationStatusEnum_done;

  static Serializer<DocumentChatThreadDtoActiveGenerationStatusEnum> get serializer => _$documentChatThreadDtoActiveGenerationStatusEnumSerializer;

  const DocumentChatThreadDtoActiveGenerationStatusEnum._(String name): super(name);

  static BuiltSet<DocumentChatThreadDtoActiveGenerationStatusEnum> get values => _$documentChatThreadDtoActiveGenerationStatusEnumValues;
  static DocumentChatThreadDtoActiveGenerationStatusEnum valueOf(String name) => _$documentChatThreadDtoActiveGenerationStatusEnumValueOf(name);
}

