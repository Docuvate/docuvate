//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'move_documents_previous_folder_dto.g.dart';

/// MoveDocumentsPreviousFolderDto
///
/// Properties:
/// * [documentId] 
/// * [folderId] 
@BuiltValue()
abstract class MoveDocumentsPreviousFolderDto implements Built<MoveDocumentsPreviousFolderDto, MoveDocumentsPreviousFolderDtoBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'folderId')
  String get folderId;

  MoveDocumentsPreviousFolderDto._();

  factory MoveDocumentsPreviousFolderDto([void updates(MoveDocumentsPreviousFolderDtoBuilder b)]) = _$MoveDocumentsPreviousFolderDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MoveDocumentsPreviousFolderDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MoveDocumentsPreviousFolderDto> get serializer => _$MoveDocumentsPreviousFolderDtoSerializer();
}

class _$MoveDocumentsPreviousFolderDtoSerializer implements PrimitiveSerializer<MoveDocumentsPreviousFolderDto> {
  @override
  final Iterable<Type> types = const [MoveDocumentsPreviousFolderDto, _$MoveDocumentsPreviousFolderDto];

  @override
  final String wireName = r'MoveDocumentsPreviousFolderDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MoveDocumentsPreviousFolderDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    yield r'folderId';
    yield serializers.serialize(
      object.folderId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MoveDocumentsPreviousFolderDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MoveDocumentsPreviousFolderDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentId = valueDes;
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MoveDocumentsPreviousFolderDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MoveDocumentsPreviousFolderDtoBuilder();
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

