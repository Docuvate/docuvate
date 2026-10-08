//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_chat_provider_info_dto.g.dart';

/// DocumentChatProviderInfoDto
///
/// Properties:
/// * [id] 
/// * [label] 
/// * [description] 
/// * [available] 
@BuiltValue()
abstract class DocumentChatProviderInfoDto implements Built<DocumentChatProviderInfoDto, DocumentChatProviderInfoDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'label')
  String get label;

  @BuiltValueField(wireName: r'description')
  String get description;

  @BuiltValueField(wireName: r'available')
  bool get available;

  DocumentChatProviderInfoDto._();

  factory DocumentChatProviderInfoDto([void updates(DocumentChatProviderInfoDtoBuilder b)]) = _$DocumentChatProviderInfoDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentChatProviderInfoDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentChatProviderInfoDto> get serializer => _$DocumentChatProviderInfoDtoSerializer();
}

class _$DocumentChatProviderInfoDtoSerializer implements PrimitiveSerializer<DocumentChatProviderInfoDto> {
  @override
  final Iterable<Type> types = const [DocumentChatProviderInfoDto, _$DocumentChatProviderInfoDto];

  @override
  final String wireName = r'DocumentChatProviderInfoDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentChatProviderInfoDto object, {
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
    yield r'description';
    yield serializers.serialize(
      object.description,
      specifiedType: const FullType(String),
    );
    yield r'available';
    yield serializers.serialize(
      object.available,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentChatProviderInfoDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentChatProviderInfoDtoBuilder result,
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
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.description = valueDes;
          break;
        case r'available':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.available = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentChatProviderInfoDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentChatProviderInfoDtoBuilder();
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

