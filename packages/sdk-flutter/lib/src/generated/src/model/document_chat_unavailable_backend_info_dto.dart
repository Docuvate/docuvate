//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_unavailable_backend_info_dto.g.dart';

/// DocumentChatUnavailableBackendInfoDto
///
/// Properties:
/// * [id] 
/// * [label] 
/// * [reason] 
/// * [setupHint] 
@BuiltValue()
abstract class DocumentChatUnavailableBackendInfoDto implements Built<DocumentChatUnavailableBackendInfoDto, DocumentChatUnavailableBackendInfoDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'label')
  String get label;

  @BuiltValueField(wireName: r'reason')
  String get reason;

  @BuiltValueField(wireName: r'setupHint')
  String get setupHint;

  DocumentChatUnavailableBackendInfoDto._();

  factory DocumentChatUnavailableBackendInfoDto([void updates(DocumentChatUnavailableBackendInfoDtoBuilder b)]) = _$DocumentChatUnavailableBackendInfoDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatUnavailableBackendInfoDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatUnavailableBackendInfoDto> get serializer => _$DocumentChatUnavailableBackendInfoDtoSerializer();
}

class _$DocumentChatUnavailableBackendInfoDtoSerializer implements PrimitiveSerializer<DocumentChatUnavailableBackendInfoDto> {
  @override
  final Iterable<Type> types = const [DocumentChatUnavailableBackendInfoDto, _$DocumentChatUnavailableBackendInfoDto];

  @override
  final String wireName = r'DocumentChatUnavailableBackendInfoDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatUnavailableBackendInfoDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'label';
    yield serializers.serialize(
      object.label,
      specifiedType: const FullType(String),
    );
    yield r'reason';
    yield serializers.serialize(
      object.reason,
      specifiedType: const FullType(String),
    );
    yield r'setupHint';
    yield serializers.serialize(
      object.setupHint,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatUnavailableBackendInfoDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatUnavailableBackendInfoDtoBuilder result,
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
        case r'label':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.label = valueDes;
          break;
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reason = valueDes;
          break;
        case r'setupHint':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.setupHint = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatUnavailableBackendInfoDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatUnavailableBackendInfoDtoBuilder();
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

